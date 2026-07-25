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
  const gstNumber = String(formData.get("gstNumber") ?? "").trim();
  const qstNumber = String(formData.get("qstNumber") ?? "").trim();
  const gstRatePercent = Number(formData.get("gstRatePercent"));
  const qstRatePercent = Number(formData.get("qstRatePercent"));
  const contactEmail = String(formData.get("contactEmail") ?? "").trim();
  const contactPhone = String(formData.get("contactPhone") ?? "").trim();
  const addressFr = String(formData.get("addressFr") ?? "").trim();
  const addressEn = String(formData.get("addressEn") ?? "").trim();
  const hoursFr = String(formData.get("hoursFr") ?? "").trim();
  const hoursEn = String(formData.get("hoursEn") ?? "").trim();

  if (!contactEmail || !contactPhone || !addressFr || !addressEn || !hoursFr || !hoursEn) {
    throw new Error("Les coordonnées (courriel, téléphone, adresse et horaires en français et anglais) sont requises.");
  }

  if (!Number.isFinite(pickupDeadlineBusinessDays) || pickupDeadlineBusinessDays < 1) {
    throw new Error("Le délai de retrait doit être d'au moins 1 jour ouvrable.");
  }
  if (!Number.isFinite(cancellationFeePercent) || cancellationFeePercent < 0 || cancellationFeePercent > 100) {
    throw new Error("Les frais d'annulation doivent être entre 0 et 100%.");
  }
  if (!Number.isFinite(gstRatePercent) || gstRatePercent < 0 || gstRatePercent > 100) {
    throw new Error("Le taux de TPS doit être entre 0 et 100%.");
  }
  if (!Number.isFinite(qstRatePercent) || qstRatePercent < 0 || qstRatePercent > 100) {
    throw new Error("Le taux de TVQ doit être entre 0 et 100%.");
  }

  await updateStoreSettings({
    pickupDeadlineBusinessDays,
    cancellationFeePercent,
    adminNotificationEmail: adminNotificationEmail || null,
    gstNumber: gstNumber || null,
    qstNumber: qstNumber || null,
    gstRatePercent,
    qstRatePercent,
    contactEmail,
    contactPhone,
    addressFr,
    addressEn,
    hoursFr,
    hoursEn,
  });
  await recordAudit(admin.id, "StoreSettings", "singleton", "update");

  revalidatePath("/admin/settings");
  revalidatePath("/", "layout");
}
