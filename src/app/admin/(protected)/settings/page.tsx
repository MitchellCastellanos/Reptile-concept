import { prisma } from "@/lib/db";
import { getStoreSettings } from "@/lib/settings";
import { getCurrentAdmin } from "@/lib/auth";
import { parseWeeklyHours } from "@/lib/business-hours";
import { AccountForm } from "./account-form";
import { SettingsForm } from "./settings-form";

export default async function AdminSettingsPage() {
  const settings = await getStoreSettings();
  const admin = await getCurrentAdmin();
  const weeklyHours = parseWeeklyHours(settings.weeklyHours);

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Réglages</h1>

      <fieldset className="flex max-w-2xl flex-col gap-2 rounded-lg border border-black/10 p-4 dark:border-white/10">
        <legend className="px-1 text-sm font-medium">Mon compte administrateur</legend>
        <p className="text-xs text-zinc-600 dark:text-zinc-400">
          Changez le courriel et le mot de passe utilisés pour vous connecter à l&apos;admin.
        </p>
        {admin ? <AccountForm currentEmail={admin.email} /> : null}
      </fieldset>

      <SettingsForm
        settings={{
          pickupDeadlineBusinessDays: settings.pickupDeadlineBusinessDays,
          cancellationFeePercent: Number(settings.cancellationFeePercent),
          adminNotificationEmail: settings.adminNotificationEmail,
          contactEmail: settings.contactEmail,
          contactPhone: settings.contactPhone,
          addressFr: settings.addressFr,
          addressEn: settings.addressEn,
          gstNumber: settings.gstNumber,
          gstRatePercent: Number(settings.gstRatePercent),
          qstNumber: settings.qstNumber,
          qstRatePercent: Number(settings.qstRatePercent),
          facebookUrl: settings.facebookUrl,
          facebookFollowerCount: settings.facebookFollowerCount,
        }}
        weeklyHours={weeklyHours}
      />
    </div>
  );
}
