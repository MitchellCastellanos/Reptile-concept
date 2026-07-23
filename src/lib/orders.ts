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
