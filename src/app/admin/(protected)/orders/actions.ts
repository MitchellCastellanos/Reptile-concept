"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";

export async function updateOrderStatusAction(id: string, formData: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const status = String(formData.get("status")) as
    | "pending_payment"
    | "paid"
    | "preparing"
    | "weather_hold"
    | "ready_to_ship"
    | "shipped"
    | "delivered"
    | "cancelled"
    | "refunded";
  const carrier = String(formData.get("carrier") ?? "").trim();
  const trackingNumber = String(formData.get("trackingNumber") ?? "").trim();

  await prisma.order.update({
    where: { id },
    data: {
      status,
      carrier: carrier || undefined,
      trackingNumber: trackingNumber || undefined,
      shippedAt: status === "shipped" ? new Date() : undefined,
    },
  });
  await recordAudit(admin.id, "Order", id, "update");

  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin/orders");
}
