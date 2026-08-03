"use server";

import bcrypt from "bcryptjs";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/db";
import { getCurrentAdmin } from "@/lib/auth";
import { updateStoreSettings } from "@/lib/settings";
import { recordAudit } from "@/lib/audit";
import { isCloverConfigured } from "@/lib/clover";
import { pollClover } from "@/lib/clover-sync";
import {
  DAY_ORDER,
  DAY_LABELS,
  DEFAULT_WEEKLY_HOURS,
  isValidTime,
  formatWeeklyHours,
  type WeeklyHours,
} from "@/lib/business-hours";

function parseWeeklyHoursFromForm(formData: FormData): WeeklyHours {
  const weeklyHours = {} as WeeklyHours;
  for (const day of DAY_ORDER) {
    const closed = formData.has(`closed_${day}`);
    // The start/end <select> elements are disabled (and so absent from
    // FormData) when a day is marked closed — fall back to the default
    // times rather than rejecting the submission.
    const rawStart = formData.get(`start_${day}`);
    const rawEnd = formData.get(`end_${day}`);
    const start = closed && rawStart === null ? DEFAULT_WEEKLY_HOURS[day].start : String(rawStart ?? "");
    const end = closed && rawEnd === null ? DEFAULT_WEEKLY_HOURS[day].end : String(rawEnd ?? "");

    if (!isValidTime(start) || !isValidTime(end)) {
      throw new Error("Heures d'ouverture invalides.");
    }
    if (!closed && start >= end) {
      throw new Error(`L'heure de fermeture doit être après l'heure d'ouverture (${DAY_LABELS[day].fr}).`);
    }

    weeklyHours[day] = { closed, start, end };
  }
  return weeklyHours;
}

export type UpdateSettingsResult = { error?: string; success?: string };

export async function updateSettingsAction(
  _prevState: UpdateSettingsResult | undefined,
  formData: FormData,
): Promise<UpdateSettingsResult> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  try {
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
    const weeklyHours = parseWeeklyHoursFromForm(formData);
    const hoursFr = formatWeeklyHours(weeklyHours, "fr");
    const hoursEn = formatWeeklyHours(weeklyHours, "en");

    if (!contactEmail || !contactPhone || !addressFr || !addressEn) {
      return { error: "Les coordonnées (courriel, téléphone et adresse en français et anglais) sont requises." };
    }

    if (!Number.isFinite(pickupDeadlineBusinessDays) || pickupDeadlineBusinessDays < 1) {
      return { error: "Le délai de retrait doit être d'au moins 1 jour ouvrable." };
    }
    if (!Number.isFinite(cancellationFeePercent) || cancellationFeePercent < 0 || cancellationFeePercent > 100) {
      return { error: "Les frais d'annulation doivent être entre 0 et 100%." };
    }
    if (!Number.isFinite(gstRatePercent) || gstRatePercent < 0 || gstRatePercent > 100) {
      return { error: "Le taux de TPS doit être entre 0 et 100%." };
    }
    if (!Number.isFinite(qstRatePercent) || qstRatePercent < 0 || qstRatePercent > 100) {
      return { error: "Le taux de TVQ doit être entre 0 et 100%." };
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
      weeklyHours,
    });
    await recordAudit(admin.id, "StoreSettings", "singleton", "update");

    revalidatePath("/admin/settings");
    revalidatePath("/", "layout");

    return { success: "Réglages enregistrés." };
  } catch (err) {
    return { error: err instanceof Error ? err.message : "Erreur lors de l'enregistrement des réglages." };
  }
}

export type CloverSyncNowResult = {
  error?: string;
  ordersChecked?: number;
  ordersProcessed?: number;
  itemsChecked?: number;
  itemsQueued?: number;
  itemsAutoCreated?: number;
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

export type UpdateAccountResult = { error?: string; success?: string };

export async function updateAccountAction(
  _prevState: UpdateAccountResult | undefined,
  formData: FormData,
): Promise<UpdateAccountResult> {
  const admin = await getCurrentAdmin();
  if (!admin) redirect("/admin/login");

  const currentPassword = String(formData.get("currentPassword") ?? "");
  const newEmail = String(formData.get("newEmail") ?? "").trim().toLowerCase();
  const newPassword = String(formData.get("newPassword") ?? "");
  const confirmPassword = String(formData.get("confirmPassword") ?? "");

  const currentPasswordValid = await bcrypt.compare(currentPassword, admin.passwordHash);
  if (!currentPasswordValid) {
    return { error: "Mot de passe actuel incorrect / Current password is incorrect." };
  }

  if (!newEmail) {
    return { error: "Le courriel est requis / Email is required." };
  }

  if (newPassword || confirmPassword) {
    if (newPassword.length < 8) {
      return {
        error: "Le nouveau mot de passe doit contenir au moins 8 caractères / New password must be at least 8 characters.",
      };
    }
    if (newPassword !== confirmPassword) {
      return { error: "Les mots de passe ne correspondent pas / Passwords do not match." };
    }
  }

  if (newEmail !== admin.email) {
    const existing = await prisma.adminUser.findUnique({ where: { email: newEmail } });
    if (existing && existing.id !== admin.id) {
      return {
        error: "Ce courriel est déjà utilisé par un autre compte administrateur / Email already in use.",
      };
    }
  }

  await prisma.adminUser.update({
    where: { id: admin.id },
    data: {
      email: newEmail,
      ...(newPassword ? { passwordHash: await bcrypt.hash(newPassword, 10) } : {}),
    },
  });
  await recordAudit(admin.id, "AdminUser", admin.id, "update");

  revalidatePath("/admin/settings");

  return { success: "Compte mis à jour / Account updated." };
}
