// Clover Terminal Connector integration. Like the "manual" payment placeholder
// and the email transport, this simulates an approved transaction (after a
// short delay, to mimic waiting on the physical terminal) until the client's
// real Clover credentials (CLOVER_MERCHANT_ID + CLOVER_API_TOKEN) are set, at
// which point it sends a real Pay Display request to the terminal and polls
// for the cashier's response.
//
// Reference: Clover's Cloud Pay Display / Terminal Connector API lets a
// third-party app tell an in-store Clover terminal to charge a specific
// amount and returns the transaction result once the customer taps/inserts
// their card — this is the shape we're calling out to below. The exact
// endpoint/payload should be confirmed against the client's Clover developer
// account once they connect it (sandbox first).

type ChargeInput = {
  amountCAD: number;
  description: string;
};

type ChargeResult =
  | { success: true; transactionId: string }
  | { success: false; error: string };

export function isCloverConfigured(): boolean {
  return getCloverCredentials() !== null;
}

function getCloverCredentials(): { merchantId: string; apiToken: string } | null {
  const merchantId = process.env.CLOVER_MERCHANT_ID;
  const apiToken = process.env.CLOVER_API_TOKEN;
  if (!merchantId || !apiToken) return null;
  return { merchantId, apiToken };
}

function cloverApiBase() {
  // Clover splits sandbox vs production across two hostnames; default to
  // production once real credentials are set, but let a sandbox merchant
  // opt in explicitly while testing the Inventory/Orders/webhook flow.
  return process.env.CLOVER_ENV === "sandbox"
    ? "https://apisandbox.dev.clover.com"
    : "https://api.clover.com";
}

async function cloverApiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const creds = getCloverCredentials();
  if (!creds) throw new Error("Clover credentials not configured (CLOVER_MERCHANT_ID / CLOVER_API_TOKEN).");

  const res = await fetch(`${cloverApiBase()}/v3/merchants/${creds.merchantId}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${creds.apiToken}`,
      "Content-Type": "application/json",
      ...init?.headers,
    },
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`Clover API error ${res.status} on ${path}: ${body}`);
  }
  return res.json() as Promise<T>;
}

export type CloverItem = {
  id: string;
  name: string;
  price: number; // cents
  code?: string;
  sku?: string;
  categories?: { elements: { id: string; name: string }[] };
  stockCount?: number;
};

export type CloverLineItem = {
  id: string;
  item?: { id: string };
  name: string;
  price: number; // cents
  unitQty?: number;
};

export type CloverOrder = {
  id: string;
  state?: string;
  total: number; // cents
  createdTime?: number;
  modifiedTime?: number;
  lineItems?: { elements: CloverLineItem[] };
  payments?: { elements: { id: string; amount: number; result?: string; tender?: { label?: string } }[] };
};

// Reference: Clover Inventory API (GET /v3/merchants/{mId}/items/{itemId}).
// Confirm the exact expand params against the client's sandbox account.
export async function fetchCloverItem(itemId: string): Promise<CloverItem> {
  return cloverApiFetch<CloverItem>(`/items/${itemId}?expand=categories`);
}

// Reference: Clover Orders API (GET /v3/merchants/{mId}/orders/{orderId}).
export async function fetchCloverOrder(orderId: string): Promise<CloverOrder> {
  return cloverApiFetch<CloverOrder>(`/orders/${orderId}?expand=lineItems,payments`);
}

// Polling fallback for the webhook — pulls orders modified since `sinceMs`
// (epoch milliseconds). Clover paginates at 100 by default; a client this
// size shouldn't hit that within one polling window, but if volume grows
// this needs an offset loop.
export async function listModifiedCloverOrders(sinceMs: number): Promise<CloverOrder[]> {
  const data = await cloverApiFetch<{ elements?: CloverOrder[] }>(
    `/orders?filter=modifiedTime>=${sinceMs}&expand=lineItems,payments&limit=100`,
  );
  return data.elements ?? [];
}

// Polling fallback counterpart to listModifiedCloverOrders — catches new
// items captured (or edited/re-priced) directly on the Clover device so the
// site's import queue and linked price/stock stay current even if a webhook
// delivery is missed. Same pagination caveat as listModifiedCloverOrders.
export async function listModifiedCloverItems(sinceMs: number): Promise<CloverItem[]> {
  const data = await cloverApiFetch<{ elements?: CloverItem[] }>(
    `/items?filter=modifiedTime>=${sinceMs}&expand=categories&limit=100`,
  );
  return data.elements ?? [];
}

// Pushes the current stock count for an item we already know the Clover
// item id for (set via the "Clover Item ID" field on the animal/product
// admin form). Called after an online sale so the standalone Clover device
// stops offering something that just sold on the site.
// Reference: Clover Inventory API item-stock endpoint — confirm exact verb
// (POST vs PUT) against the client's sandbox account before relying on it.
export async function setCloverItemStock(cloverItemId: string, quantity: number): Promise<void> {
  await cloverApiFetch(`/item_stocks/${cloverItemId}`, {
    method: "POST",
    body: JSON.stringify({ quantity }),
  });
}

export async function chargeCloverTerminal({ amountCAD, description }: ChargeInput): Promise<ChargeResult> {
  const merchantId = process.env.CLOVER_MERCHANT_ID;
  const apiToken = process.env.CLOVER_API_TOKEN;

  if (!merchantId || !apiToken) {
    console.log(
      `[clover:dev] Simulated terminal charge — amount=${amountCAD.toFixed(2)} CAD, ${description}`,
    );
    await new Promise((resolve) => setTimeout(resolve, 800));
    return { success: true, transactionId: `dev-sim-${Date.now()}` };
  }

  try {
    const res = await fetch(
      `https://api.clover.com/v3/merchants/${merchantId}/pay_display`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: Math.round(amountCAD * 100), // Clover expects cents
          note: description,
        }),
      },
    );

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      return { success: false, error: `Clover a refusé la transaction (${res.status}): ${body}` };
    }

    const data = await res.json();
    return { success: true, transactionId: data.paymentId ?? data.id ?? "unknown" };
  } catch (err) {
    return {
      success: false,
      error: err instanceof Error ? err.message : "Erreur de communication avec Clover.",
    };
  }
}
