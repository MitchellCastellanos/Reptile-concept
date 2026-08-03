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
    where: { orderId, provider: "stripe", status: "succeeded" },
    orderBy: { createdAt: "desc" },
  });

  if (!payment?.providerRef) {
    console.warn(`[stripe] no Stripe payment intent to refund for order ${orderId}`);
    return { ok: false, skipped: true };
  }

  const result = await refundStripePaymentIntent(payment.providerRef, refundAmountCAD);
  if (result.ok) return { ok: true };
  return { ok: false, skipped: false, error: result.error };
}
