import { prisma } from "@/lib/db";
import { getStoreSettings } from "@/lib/settings";
import { getCurrentAdmin } from "@/lib/auth";
import { isCloverConfigured } from "@/lib/clover";
import { parseWeeklyHours } from "@/lib/business-hours";
import { CloverSyncNowButton } from "./clover-sync-button";
import { AccountForm } from "./account-form";
import { SettingsForm } from "./settings-form";

export default async function AdminSettingsPage() {
  const settings = await getStoreSettings();
  const admin = await getCurrentAdmin();
  const cloverSyncState = await prisma.cloverSyncState.findUnique({ where: { id: "singleton" } });
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

      <fieldset className="flex max-w-2xl flex-col gap-2 rounded-lg border border-black/10 p-4 dark:border-white/10">
        <legend className="px-1 text-sm font-medium">Synchronisation Clover</legend>
        <p className="text-xs text-zinc-600 dark:text-zinc-400">
          Inventaire et ventes en magasin/expo passent par l&apos;appareil Clover. Le site reçoit les
          mises à jour d&apos;articles (prix, stock, nouveaux SKUs) via webhook et sondage de secours
          (CLOVER_MERCHANT_ID / CLOVER_API_TOKEN / CLOVER_WEBHOOK_SECRET).
        </p>
        <p className="text-sm">
          Identifiants configurés :{" "}
          <span className={isCloverConfigured() ? "text-green-700 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
            {isCloverConfigured() ? "oui" : "non"}
          </span>
        </p>
        {cloverSyncState?.lastVerificationCode ? (
          <p className="text-sm">
            Dernier code de vérification reçu de Clover (à coller dans le Developer Dashboard lors
            de la configuration du webhook) :{" "}
            <code className="rounded bg-black/5 px-1.5 py-0.5 dark:bg-white/10">
              {cloverSyncState.lastVerificationCode}
            </code>
          </p>
        ) : null}
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Dernier sondage de secours :{" "}
          {cloverSyncState?.lastPolledAt
            ? cloverSyncState.lastPolledAt.toLocaleString("fr-CA")
            : "jamais"}
        </p>
        <CloverSyncNowButton />
        <p className="text-xs text-zinc-500">
          Met à jour prix/stock et la file d&apos;import pour les articles Clover déjà reliés ou
          couverts par une règle de catégorie. Les ventes comptoir restent dans Clover uniquement.
        </p>
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
