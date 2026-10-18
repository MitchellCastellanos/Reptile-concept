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

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

// Carries the HTTP status so callers can tell "Clover says this doesn't
// exist" (404) apart from a transient failure — the reconcile pass relies on
// that before it takes a linked listing offline.
export class CloverApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "CloverApiError";
  }
}

async function cloverApiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const creds = getCloverCredentials();
  if (!creds) throw new Error("Clover credentials not configured (CLOVER_MERCHANT_ID / CLOVER_API_TOKEN).");

  const maxAttempts = 5;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const res = await fetch(`${cloverApiBase()}/v3/merchants/${creds.merchantId}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${creds.apiToken}`,
        "Content-Type": "application/json",
        ...init?.headers,
      },
    });

    if (res.status === 429 && attempt < maxAttempts) {
      // Clover rate-limits per merchant token; back off and retry rather
      // than failing a whole catalog pull over one throttled page. Honor
      // Retry-After if Clover sends it, otherwise a growing default delay.
      const retryAfterSec = Number(res.headers.get("retry-after"));
      const delayMs = Number.isFinite(retryAfterSec) && retryAfterSec > 0 ? retryAfterSec * 1000 : attempt * 1000;
      await sleep(delayMs);
      continue;
    }

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      throw new CloverApiError(res.status, `Clover API error ${res.status} on ${path}: ${body}`);
    }
    return res.json() as Promise<T>;
  }
  throw new CloverApiError(429, `Clover API error 429 on ${path}: rate limited after ${maxAttempts} attempts`);
}

export type CloverItem = {
  id: string;
  name: string;
  price: number; // cents
  code?: string;
  sku?: string;
  categories?: { elements: { id: string; name: string }[] };
  stockCount?: number;
  // "FIXED" | "VARIABLE" | "PER_UNIT" — a VARIABLE item's `price` is just a
  // placeholder (usually 0) because the cashier types the amount at sale time.
  priceType?: string;
  modifiedTime?: number;
};

export type CloverItemStock = {
  item?: { id: string };
  quantity?: number;
};

// Clover keeps per-item inventory on a separate endpoint from the item
// record itself — listing items with expand=categories alone never populates
// stockCount, which is why every imported product landed at stockQty=0.
export async function fetchCloverItemStock(itemId: string): Promise<number | null> {
  try {
    const data = await cloverApiFetch<CloverItemStock>(`/item_stocks/${itemId}`);
    return data.quantity ?? null;
  } catch (err) {
    // Was previously swallowed with no trace at all — if this endpoint/path
    // is ever wrong for this merchant's account, every product's stock
    // silently stays whatever it last was, forever, with nothing in the
    // logs to explain why. Log it so a real failure here is visible instead
    // of looking identical to "Clover legitimately has no stock record yet."
    console.error(`[clover] failed to fetch item stock for ${itemId}:`, err);
    return null;
  }
}

export async function enrichCloverItemWithStock(item: CloverItem): Promise<CloverItem> {
  // /item_stocks is the stock Clover's register actually decrements and staff
  // actually edit; the legacy `stockCount` on the item record is not kept
  // current by either, so it is only a fallback for when the stock lookup
  // fails or returns nothing — never the other way around.
  const quantity = await fetchCloverItemStock(item.id);
  return { ...item, stockCount: quantity ?? item.stockCount };
}

export async function enrichCloverItemsWithStock(items: CloverItem[]): Promise<CloverItem[]> {
  const enriched: CloverItem[] = [];
  for (let i = 0; i < items.length; i++) {
    if (i > 0 && i % 10 === 0) await sleep(350);
    enriched.push(await enrichCloverItemWithStock(items[i]));
  }
  return enriched;
}

// Bulk counterpart to fetchCloverItemStock — /item_stocks is a paginated
// collection just like /items, so the whole merchant's stock table can be
// pulled in a handful of 100-per-page requests instead of one request per
// item. This is the difference between a poll that scales with the number
// of linked Products (times out well before reaching all of them once a
// catalog has a few hundred SKUs — see refreshLinkedProductStock in
// clover-sync.ts) and one that scales with total-catalog-size/100.
export async function fetchAllCloverItemStocks(): Promise<Map<string, number>> {
  const stockByItemId = new Map<string, number>();
  const pageSize = 100;
  for (let page = 0; page < 50; page++) {
    if (page > 0) await sleep(350);
    const data = await cloverApiFetch<{ elements?: CloverItemStock[] }>(
      `/item_stocks?limit=${pageSize}&offset=${page * pageSize}`,
    );
    const batch = data.elements ?? [];
    for (const stock of batch) {
      if (stock.item?.id && stock.quantity != null) stockByItemId.set(stock.item.id, stock.quantity);
    }
    if (batch.length < pageSize) break;
  }
  return stockByItemId;
}

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
export async function fetchCloverItem(itemId: string): Promise<CloverItem> {
  const item = await cloverApiFetch<CloverItem>(`/items/${itemId}?expand=categories`);
  return enrichCloverItemWithStock(item);
}

// Reference: Clover Orders API (GET /v3/merchants/{mId}/orders/{orderId}).
export async function fetchCloverOrder(orderId: string): Promise<CloverOrder> {
  return cloverApiFetch<CloverOrder>(`/orders/${orderId}?expand=lineItems,payments`);
}

// Walks a Clover collection page by page. The order/item polls used to read
// only the first 100 rows and then advance their "last polled" cursor anyway,
// so anything beyond row 100 of a busy window (e.g. right after a bulk edit or
// a re-import) was dropped for good. Returns whether it reached the end, so a
// caller can refuse to treat a truncated listing as the full picture.
async function fetchAllPages<T>(
  pathForPage: (limit: number, offset: number) => string,
  maxPages: number,
): Promise<{ elements: T[]; complete: boolean }> {
  const pageSize = 100;
  const elements: T[] = [];
  for (let page = 0; page < maxPages; page++) {
    // A small gap between pages keeps a large catalog from tripping Clover's
    // per-token rate limit outright — cloverApiFetch's 429 retry is the net.
    if (page > 0) await sleep(350);
    const data = await cloverApiFetch<{ elements?: T[] }>(pathForPage(pageSize, page * pageSize));
    const batch = data.elements ?? [];
    elements.push(...batch);
    if (batch.length < pageSize) return { elements, complete: true };
  }
  return { elements, complete: false };
}

// Polling fallback for the webhook — pulls orders modified since `sinceMs`
// (epoch milliseconds).
export async function listModifiedCloverOrders(sinceMs: number): Promise<CloverOrder[]> {
  const { elements } = await fetchAllPages<CloverOrder>(
    (limit, offset) =>
      `/orders?filter=modifiedTime>=${sinceMs}&expand=lineItems,payments&limit=${limit}&offset=${offset}`,
    20,
  );
  return elements;
}

// Polling fallback counterpart to listModifiedCloverOrders — catches new
// items captured (or edited/re-priced) directly on the Clover device so the
// site's import queue and linked price/stock stay current even if a webhook
// delivery is missed.
export async function listModifiedCloverItems(sinceMs: number): Promise<CloverItem[]> {
  const { elements } = await fetchAllPages<CloverItem>(
    (limit, offset) => `/items?filter=modifiedTime>=${sinceMs}&expand=categories&limit=${limit}&offset=${offset}`,
    20,
  );
  // A handful of items is cheaper one stock lookup each; a large burst (bulk
  // edit) is cheaper as one pass over the whole stock table.
  if (elements.length <= 15) return enrichCloverItemsWithStock(elements);
  const stockByItemId = await fetchAllCloverItemStocks();
  return elements.map((item) => ({ ...item, stockCount: stockByItemId.get(item.id) ?? item.stockCount }));
}

export type CloverCatalogSnapshot = {
  items: CloverItem[];
  // false when the page cap was hit before the end of the catalog — such a
  // snapshot can refresh what it contains but must never be used to conclude
  // that an item is missing from Clover.
  complete: boolean;
};

// Full catalog pull — unlike listModifiedCloverItems, this ignores
// modifiedTime and fetches every item that currently exists in Clover. Used
// for the on-demand backfill of /admin/clover-import and as the source of
// truth for the periodic reconcile of linked animals/products, since neither
// webhooks nor modifiedTime-based polling are reliable enough to be the only
// way a price or quantity edit reaches the site.
export async function fetchCloverCatalogSnapshot(): Promise<CloverCatalogSnapshot> {
  // Items and the stock table are independent collections — pulled in
  // parallel to halve the wall-clock time of a sync.
  const [{ elements: items, complete }, stockByItemId] = await Promise.all([
    fetchAllPages<CloverItem>(
      (limit, offset) => `/items?expand=categories&limit=${limit}&offset=${offset}`,
      60,
    ),
    fetchAllCloverItemStocks(),
  ]);
  if (!complete) console.error("[clover] catalog snapshot hit the page cap; treating it as incomplete");
  return {
    items: items.map((item) => ({ ...item, stockCount: stockByItemId.get(item.id) ?? item.stockCount })),
    complete,
  };
}

export async function fetchAllCloverItems(): Promise<CloverItem[]> {
  return (await fetchCloverCatalogSnapshot()).items;
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
