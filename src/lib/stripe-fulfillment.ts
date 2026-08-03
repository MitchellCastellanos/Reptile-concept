import type Stripe from "stripe";
import {
  cancelPendingOrder,
  fulfillPaidOrder,
} from "@/lib/order-payment";
import { isStripeConfigured, retrieveCheckoutSession } from "@/lib/stripe";

function paymentIntentIdFromSession(session: Stripe.Checkout.Session): string | undefined {
  if (!session.payment_intent) return undefined;
  return typeof session.payment_intent === "string"
    ? session.payment_intent
    : session.payment_intent.id;
}

export async function fulfillOrderFromCheckoutSession(session: Stripe.Checkout.Session) {
  const orderId = session.metadata?.orderId;
  if (!orderId) {
    console.warn("[stripe] checkout session missing orderId metadata:", session.id);
    return { ok: false as const, reason: "missing_order_id" };
  }

  if (session.payment_status !== "paid") {
    return { ok: false as const, reason: "not_paid" };
  }

  return fulfillPaidOrder(orderId, {
    checkoutSessionId: session.id,
    paymentIntentId: paymentIntentIdFromSession(session),
  });
}

export async function syncOrderFromCheckoutSessionId(sessionId: string) {
  if (!isStripeConfigured()) return null;

  const session = await retrieveCheckoutSession(sessionId);
  if (session.payment_status === "paid") {
    await fulfillOrderFromCheckoutSession(session);
  }
  return session;
}

export async function handleStripeWebhookEvent(event: Stripe.Event) {
  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      await fulfillOrderFromCheckoutSession(session);
      break;
    }
    case "checkout.session.expired": {
      const session = event.data.object as Stripe.Checkout.Session;
      const orderId = session.metadata?.orderId;
      if (orderId) {
        await cancelPendingOrder(orderId, "Paiement Stripe expiré / Stripe checkout expired");
      }
      break;
    }
    default:
      break;
  }
}
