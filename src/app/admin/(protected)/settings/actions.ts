"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentAdmin } from "@/lib/auth";
import { updateStoreSettings } from "@/lib/settings";
import { recordAudit } from "@/lib/audit";

export async function updateSettingsAction(formData: FormData) {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const pickupDeadlineBusinessDays = Number(formData.get("pickupDeadlineBusinessDays"));
  const cancellationFeePercent = Number(formData.get("cancellationFeePercent"));
  const adminNotificationEmail = String(formData.get("adminNotificationEmail") ?? "").trim();

  if (!Number.isFinite(pickupDeadlineBusinessDays) || pickupDeadlineBusinessDays < 1) {
    throw new Error("Le délai de retrait doit être d'au moins 1 jour ouvrable.");
  }
  if (!Number.isFinite(cancellationFeePercent) || cancellationFeePercent < 0 || cancellationFeePercent > 100) {
    throw new Error("Les frais d'annulation doivent être entre 0 et 100%.");
  }

  await updateStoreSettings({
    pickupDeadlineBusinessDays,
    cancellationFeePercent,
    adminNotificationEmail: adminNotificationEmail || null,
  });
  await recordAudit(admin.id, "StoreSettings", "singleton", "update");

  revalidatePath("/admin/settings");
}
