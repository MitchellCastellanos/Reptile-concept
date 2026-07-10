"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";

type OrderStatus =
  | "pending_payment"
  | "paid"
  | "preparing"
  | "weather_hold"
  | "ready_to_ship"
  | "shipped"
  | "delivered"
  | "cancelled"
  | "refunded";

export async function updateOrderStatusAction(id: string, formData: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const status = String(formData.get("status")) as OrderStatus;
  const carrier = String(formData.get("carrier") ?? "").trim();
  const trackingNumber = String(formData.get("trackingNumber") ?? "").trim();

  await prisma.$transaction(async (tx) => {
    await tx.order.update({
      where: { id },
      data: {
        status,
        carrier: carrier || undefined,
        trackingNumber: trackingNumber || undefined,
        shippedAt: status === "shipped" ? new Date() : undefined,
      },
    });

    const items = await tx.order.findUnique({ where: { id } }).items();

    if (status === "paid") {
      // Payment is confirmed manually by staff until a real payment processor is wired up.
      for (const item of items ?? []) {
        if (item.animalId) {
          await tx.animal.updateMany({
            where: { id: item.animalId, status: "reserved" },
            data: { status: "sold" },
          });
        }
      }
      await tx.payment.updateMany({
        where: { orderId: id, status: "pending" },
        data: { status: "succeeded", paidAt: new Date() },
      });
    }

    if (status === "cancelled" || status === "refunded") {
      for (const item of items ?? []) {
        if (item.animalId) {
          await tx.animal.updateMany({
            where: { id: item.animalId, status: "reserved" },
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
      if (status === "refunded") {
        await tx.payment.updateMany({
          where: { orderId: id, status: "succeeded" },
          data: { status: "refunded" },
        });
      }
    }
  });

  await recordAudit(admin.id, "Order", id, "update");

  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin/orders");
}
