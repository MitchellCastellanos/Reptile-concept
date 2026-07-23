"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth";
import { recordAudit } from "@/lib/audit";
import { getStoreSettings } from "@/lib/settings";
import { addBusinessDays } from "@/lib/business-days";
import { restoreOrderInventory, calcOrderTotalCAD } from "@/lib/orders";
import {
  sendOrderPreparingEmail,
  sendOrderReadyForPickupEmail,
  sendOrderPickedUpEmail,
} from "@/lib/order-notifications";

async function requireAdmin() {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");
  return admin;
}

function revalidateOrder(id: string) {
  revalidatePath(`/admin/orders/${id}`);
  revalidatePath("/admin/orders");
  revalidatePath("/admin/finance");
}

export async function markPreparingAction(orderId: string) {
  const admin = await requireAdmin();

  await prisma.order.update({
    where: { id: orderId, status: "paid" },
    data: { status: "preparing", preparingAt: new Date() },
  });
  await recordAudit(admin.id, "Order", orderId, "update");

  try {
    await sendOrderPreparingEmail(orderId);
  } catch (err) {
    console.error(`[orders] failed to send preparing email for ${orderId}:`, err);
  }

  revalidateOrder(orderId);
}

export async function markReadyForPickupAction(orderId: string) {
  const admin = await requireAdmin();
  const settings = await getStoreSettings();
  const readyAt = new Date();
  const deadline = addBusinessDays(readyAt, settings.pickupDeadlineBusinessDays);

  await prisma.$transaction(async (tx) => {
    const order = await tx.order.update({
      where: { id: orderId, status: "preparing" },
      data: { status: "ready_for_pickup", readyForPickupAt: readyAt, pickupDeadlineAt: deadline },
      include: { items: true },
    });

    // The sale is booked (revenue recognized) at the point staff confirm the
    // order is finalized and set aside for the customer.
    const totalCAD = calcOrderTotalCAD(order.items);
    await tx.financialRecord.create({
      data: {
        orderId,
        type: "sale",
        amountCAD: totalCAD,
        note: "Vente confirmée — prête pour retrait",
      },
    });
  });

  await recordAudit(admin.id, "Order", orderId, "update");

  try {
    await sendOrderReadyForPickupEmail(orderId, deadline, Number(settings.cancellationFeePercent));
  } catch (err) {
    console.error(`[orders] failed to send ready-for-pickup email for ${orderId}:`, err);
  }

  revalidateOrder(orderId);
}

export async function markPickedUpAction(orderId: string) {
  const admin = await requireAdmin();

  await prisma.order.update({
    where: { id: orderId, status: "ready_for_pickup" },
    data: { status: "picked_up", pickedUpAt: new Date() },
  });
  await recordAudit(admin.id, "Order", orderId, "update");

  try {
    await sendOrderPickedUpEmail(orderId);
  } catch (err) {
    console.error(`[orders] failed to send picked-up email for ${orderId}:`, err);
  }

  revalidateOrder(orderId);
}

export async function cancelOrderAction(orderId: string, formData: FormData) {
  const admin = await requireAdmin();
  const applyFee = formData.get("applyFee") === "on";

  await prisma.$transaction(async (tx) => {
    const order = await tx.order.findUniqueOrThrow({
      where: { id: orderId },
      include: { items: true },
    });
    if (order.status === "picked_up" || order.status === "refunded" || order.status === "cancelled") {
      throw new Error("Cette commande ne peut plus être annulée.");
    }

    await restoreOrderInventory(tx, orderId);

    const totalCAD = calcOrderTotalCAD(order.items);
    const settings = await getStoreSettings();
    const feePercent = applyFee ? Number(settings.cancellationFeePercent) : 0;
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

    // Only reverse the sale ledger entry if one was actually booked (i.e. the
    // order had already reached ready_for_pickup).
    if (order.status === "ready_for_pickup") {
      await tx.financialRecord.create({
        data: {
          orderId,
          type: "refund",
          amountCAD: refundAmount,
          note: "Remboursement — annulation manuelle",
        },
      });
      if (feeAmount > 0) {
        await tx.financialRecord.create({
          data: {
            orderId,
            type: "cancellation_fee",
            amountCAD: feeAmount,
            note: "Frais d'annulation — annulation manuelle",
          },
        });
      }
    }
  });

  await recordAudit(admin.id, "Order", orderId, "update");
  revalidateOrder(orderId);
}
