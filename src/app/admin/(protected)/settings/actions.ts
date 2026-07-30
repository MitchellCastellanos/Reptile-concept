"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { getCurrentAdmin } from "@/lib/auth";
import { updateStoreSettings } from "@/lib/settings";
import { recordAudit } from "@/lib/audit";
import { isCloverConfigured } from "@/lib/clover";
import { pollClover } from "@/lib/clover-sync";

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

export type CloverSyncNowResult = {
  error?: string;
  ordersChecked?: number;
  ordersProcessed?: number;
  itemsChecked?: number;
  itemsQueued?: number;
};

// Manual "just in case" trigger — forces the same reconciliation the
// polling cron does every 10 minutes, without waiting for it (or for a
// webhook delivery that may have been missed): syncs sales for
// already-linked animals/products, updates price/stock for linked items
// edited directly in Clover, and queues any brand-new Clover item into
// /admin/clover-import for staff to turn into a real listing.
export async function syncCloverNowAction(
  _prevState: CloverSyncNowResult | undefined,
): Promise<CloverSyncNowResult> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  if (!isCloverConfigured()) {
    return { error: "Identifiants Clover non configurés (CLOVER_MERCHANT_ID / CLOVER_API_TOKEN)." };
  }

  try {
    const result = await pollClover();
    await recordAudit(admin.id, "CloverSyncState", "singleton", "update");

    revalidatePath("/admin/settings");
    revalidatePath("/admin/finance");
    revalidatePath("/admin/animals");
    revalidatePath("/admin/products");
    revalidatePath("/admin/clover-import");
    revalidatePath("/animals");
    revalidatePath("/boutique");

    return result;
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erreur de synchronisation avec Clover." };
  }
}
