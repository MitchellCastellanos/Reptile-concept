import Stripe from "stripe";

let stripeClient: Stripe | null = null;

export function isStripeConfigured(): boolean {
  return Boolean(process.env.STRIPE_SECRET_KEY?.trim());
}

export function getStripe(): Stripe {
  const key = process.env.STRIPE_SECRET_KEY?.trim();
  if (!key) {
    throw new Error("STRIPE_SECRET_KEY is not configured");
  }

  if (!stripeClient) {
    stripeClient = new Stripe(key);
  }

  return stripeClient;
}

export function cadToStripeCents(amountCAD: number): number {
  return Math.round(amountCAD * 100);
}

export type CheckoutLineItem = {
  name: string;
  unitAmountCAD: number;
  quantity: number;
};

export type CreateCheckoutSessionInput = {
  orderId: string;
  locale: "fr" | "en";
  customerEmail: string;
  lineItems: CheckoutLineItem[];
  gstAmountCAD: number;
  qstAmountCAD: number;
};

export async function createStripeCheckoutSession(input: CreateCheckoutSessionInput) {
  const stripe = getStripe();
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, "") ?? getFallbackSiteUrl();
  const localePrefix = input.locale === "en" ? "en" : "fr";
  const taxLabels =
    input.locale === "en"
      ? { gst: "GST", qst: "QST" }
      : { gst: "TPS", qst: "TVQ" };

  const stripeLineItems: Stripe.Checkout.SessionCreateParams.LineItem[] = input.lineItems.map(
    (item) => ({
      quantity: item.quantity,
      price_data: {
        currency: "cad",
        unit_amount: cadToStripeCents(item.unitAmountCAD),
        product_data: { name: item.name },
      },
    }),
  );

  if (input.gstAmountCAD > 0) {
    stripeLineItems.push({
      quantity: 1,
      price_data: {
        currency: "cad",
        unit_amount: cadToStripeCents(input.gstAmountCAD),
        product_data: { name: taxLabels.gst },
      },
    });
  }

  if (input.qstAmountCAD > 0) {
    stripeLineItems.push({
      quantity: 1,
      price_data: {
        currency: "cad",
        unit_amount: cadToStripeCents(input.qstAmountCAD),
        product_data: { name: taxLabels.qst },
      },
    });
  }

  return stripe.checkout.sessions.create({
    mode: "payment",
    customer_email: input.customerEmail,
    line_items: stripeLineItems,
    payment_method_types: ["card", "klarna"],
    locale: input.locale === "en" ? "en" : "fr",
    metadata: { orderId: input.orderId },
    success_url: `${siteUrl}/${localePrefix}/checkout/confirmation/${input.orderId}?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${siteUrl}/${localePrefix}/checkout?cancelled=1`,
    expires_at: Math.floor(Date.now() / 1000) + 60 * 60 * 24,
  });
}

function getFallbackSiteUrl() {
  if (process.env.VERCEL_URL) return `https://${process.env.VERCEL_URL}`;
  return "http://localhost:3000";
}

export async function retrieveCheckoutSession(sessionId: string) {
  const stripe = getStripe();
  return stripe.checkout.sessions.retrieve(sessionId, {
    expand: ["payment_intent"],
  });
}

export async function refundStripePaymentIntent(
  paymentIntentId: string,
  amountCAD: number,
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!isStripeConfigured()) {
    return { ok: false, error: "Stripe is not configured" };
  }

  try {
    const stripe = getStripe();
    await stripe.refunds.create({
      payment_intent: paymentIntentId,
      amount: cadToStripeCents(amountCAD),
    });
    return { ok: true };
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    console.error(`[stripe] refund failed for ${paymentIntentId}:`, err);
    return { ok: false, error: message };
  }
}
