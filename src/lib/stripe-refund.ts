import { prisma } from "@/lib/db";
import { isStripeConfigured, refundStripePaymentIntent } from "@/lib/stripe";

export type StripeRefundResult =
  | { ok: true }
  | { ok: false; skipped: true }
  | { ok: false; skipped: false; error: string };

export async function issueStripeRefundForOrder(
  orderId: string,
  refundAmountCAD: number,
): Promise<StripeRefundResult> {
  if (!isStripeConfigured() || refundAmountCAD <= 0) {
    return { ok: false, skipped: true };
  }

  const payment = await prisma.payment.findFirst({
    // The calling transaction has already flipped the payment to "refunded",
    // so match both states or the refund is silently skipped.
    where: { orderId, provider: "stripe", status: { in: ["succeeded", "refunded"] } },
    orderBy: { createdAt: "desc" },
  });

  if (!payment?.providerRef) {
    console.warn(`[stripe] no Stripe payment intent to refund for order ${orderId}`);
    return { ok: false, skipped: true };
  }

  const result = await refundStripePaymentIntent(payment.providerRef, refundAmountCAD, `refund-${orderId}`);
  if (result.ok) return { ok: true };
  return { ok: false, skipped: false, error: result.error };
}
