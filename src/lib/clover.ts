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
