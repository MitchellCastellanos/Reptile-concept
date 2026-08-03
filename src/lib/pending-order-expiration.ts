import { prisma } from "@/lib/db";
import { cancelPendingOrder } from "@/lib/order-payment";

const PENDING_ORDER_MAX_AGE_MS = 25 * 60 * 60 * 1000;

export async function expireStalePendingPaymentOrders() {
  const cutoff = new Date(Date.now() - PENDING_ORDER_MAX_AGE_MS);
  const stale = await prisma.order.findMany({
    where: { status: "pending_payment", createdAt: { lt: cutoff } },
    select: { id: true },
  });

  let expiredCount = 0;
  for (const { id } of stale) {
    const cancelled = await cancelPendingOrder(
      id,
      "Commande abandonnée — délai de paiement expiré / Checkout abandoned",
    );
    if (cancelled) expiredCount++;
  }

  return expiredCount;
}
