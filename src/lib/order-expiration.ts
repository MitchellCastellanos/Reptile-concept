import { prisma } from "@/lib/db";
import { getStoreSettings } from "@/lib/settings";
import { restoreOrderInventory, calcOrderTotalCAD } from "@/lib/orders";
import { sendOrderExpiredEmail } from "@/lib/order-notifications";

// Orders past their pickup deadline are auto-cancelled and refunded (minus the
// configured cancellation fee). Called opportunistically from the admin orders
// list, and can also be wired to a cron endpoint (see /api/cron/expire-orders).
export async function expireOverduePickups() {
  const overdue = await prisma.order.findMany({
    where: { status: "ready_for_pickup", pickupDeadlineAt: { lt: new Date() } },
    select: { id: true },
  });

  let expiredCount = 0;
  for (const { id } of overdue) {
    const result = await expireOrder(id);
    if (result) expiredCount++;
  }
  return expiredCount;
}

export async function expireOrder(orderId: string) {
  const settings = await getStoreSettings();
  const feePercent = Number(settings.cancellationFeePercent);

  const result = await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUnique({ where: { id: orderId }, include: { items: true } });
    if (!order || order.status !== "ready_for_pickup") return null;

    await restoreOrderInventory(tx, orderId);

    const totalCAD = calcOrderTotalCAD(order.items);
    const feeAmount = Number(((totalCAD * feePercent) / 100).toFixed(2));
    const refundAmount = Number((totalCAD - feeAmount).toFixed(2));

    await tx.order.update({
      where: { id: orderId },
      data: {
        status: "refunded",
        cancelledAt: new Date(),
        cancellationFeeCAD: feeAmount,
        refundAmountCAD: refundAmount,
      },
    });
    await tx.payment.updateMany({
      where: { orderId, status: "succeeded" },
      data: { status: "refunded" },
    });
    await tx.financialRecord.create({
      data: {
        orderId,
        type: "refund",
        amountCAD: refundAmount,
        note: "Remboursement automatique — délai de retrait expiré",
      },
    });
    if (feeAmount > 0) {
      await tx.financialRecord.create({
        data: {
          orderId,
          type: "cancellation_fee",
          amountCAD: feeAmount,
          note: "Frais d'annulation — délai de retrait expiré",
        },
      });
    }

    return { refundAmount, feeAmount };
  });

  if (result) {
    try {
      await sendOrderExpiredEmail(orderId, result.refundAmount, result.feeAmount);
    } catch (err) {
      console.error(`[order-expiration] failed to send expiry email for ${orderId}:`, err);
    }
  }

  return result;
}
