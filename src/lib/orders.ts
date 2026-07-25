import { Prisma } from "@/generated/prisma/client";

export async function restoreOrderInventory(tx: Prisma.TransactionClient, orderId: string) {
  const items = await tx.orderItem.findMany({ where: { orderId } });
  for (const item of items) {
    if (item.animalId) {
      await tx.animal.updateMany({
        where: { id: item.animalId, status: "sold" },
        data: { status: "available" },
      });
    }
    if (item.productId) {
      await tx.product.update({
        where: { id: item.productId },
        data: { stockQty: { increment: item.quantity } },
      });
    }
  }
}

export function calcOrderTotalCAD(
  items: { priceAtSaleCAD: Prisma.Decimal | number; quantity: number }[],
) {
  return items.reduce((sum, item) => sum + Number(item.priceAtSaleCAD) * item.quantity, 0);
}

// Prefers the tax breakdown snapshotted on the order at checkout time; falls
// back to a plain items subtotal (no tax) for orders placed before tax
// support existed, so old orders still resolve to a sensible amount.
export function resolveOrderAmounts(order: {
  items: { priceAtSaleCAD: Prisma.Decimal | number; quantity: number }[];
  subtotalCAD?: Prisma.Decimal | number | null;
  gstAmountCAD?: Prisma.Decimal | number | null;
  qstAmountCAD?: Prisma.Decimal | number | null;
  totalCAD?: Prisma.Decimal | number | null;
}) {
  const itemsSubtotal = calcOrderTotalCAD(order.items);
  return {
    subtotalCAD: order.subtotalCAD != null ? Number(order.subtotalCAD) : itemsSubtotal,
    gstAmountCAD: order.gstAmountCAD != null ? Number(order.gstAmountCAD) : 0,
    qstAmountCAD: order.qstAmountCAD != null ? Number(order.qstAmountCAD) : 0,
    totalCAD: order.totalCAD != null ? Number(order.totalCAD) : itemsSubtotal,
  };
}
