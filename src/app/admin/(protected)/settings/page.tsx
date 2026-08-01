import { prisma } from "@/lib/db";
import { getStoreSettings } from "@/lib/settings";
import { getCurrentAdmin } from "@/lib/auth";
import { isCloverConfigured } from "@/lib/clover";
import { updateSettingsAction } from "./actions";
import { CloverSyncNowButton } from "./clover-sync-button";
import { AccountForm } from "./account-form";

export default async function AdminSettingsPage() {
  const settings = await getStoreSettings();
  const admin = await getCurrentAdmin();
  const cloverSyncState = await prisma.cloverSyncState.findUnique({ where: { id: "singleton" } });

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
          Ventes faites directement sur l&apos;appareil Clover (magasin ou expo), reflétées ici via
          webhook (temps réel) et un sondage de secours (variables d&apos;environnement
          CLOVER_MERCHANT_ID / CLOVER_API_TOKEN / CLOVER_WEBHOOK_SECRET).
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
          Force la vérification immédiate des ventes Clover, sans attendre le sondage automatique
          (toutes les 10 minutes) ou un webhook manqué. Ne crée pas de nouvelles fiches — met à jour
          uniquement les animaux/produits déjà reliés à un article Clover.
        </p>
      </fieldset>

      <form action={updateSettingsAction} className="flex max-w-2xl flex-col gap-4">
        <label className="flex flex-col gap-1 text-sm">
          Délai de retrait (jours ouvrables)
          <input
            type="number"
            name="pickupDeadlineBusinessDays"
            min={1}
            defaultValue={settings.pickupDeadlineBusinessDays}
            className="rounded border border-black/20 px-3 py-2 dark:border-white/20 dark:bg-black"
          />
          <span className="text-xs text-zinc-600 dark:text-zinc-400">
            Nombre de jours ouvrables (le dimanche est exclu) après qu&apos;une commande soit
            marquée prête pour retrait, avant annulation automatique.
          </span>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Frais d&apos;annulation (%)
          <input
            type="number"
            name="cancellationFeePercent"
            min={0}
            max={100}
            step="0.01"
            defaultValue={Number(settings.cancellationFeePercent)}
            className="rounded border border-black/20 px-3 py-2 dark:border-white/20 dark:bg-black"
          />
          <span className="text-xs text-zinc-600 dark:text-zinc-400">
            Pourcentage retenu sur le remboursement lorsqu&apos;une commande n&apos;est pas
            récupérée à temps.
          </span>
        </label>

        <label className="flex flex-col gap-1 text-sm">
          Courriel de notification des nouvelles ventes
          <input
            type="email"
            name="adminNotificationEmail"
            defaultValue={settings.adminNotificationEmail ?? ""}
            placeholder="ventes@reptileconcept.ca"
            className="rounded border border-black/20 px-3 py-2 dark:border-white/20 dark:bg-black"
          />
          <span className="text-xs text-zinc-600 dark:text-zinc-400">
            Laissez vide pour utiliser le courriel du premier compte administrateur (propriétaire).
          </span>
        </label>

        <fieldset className="flex flex-col gap-4 rounded-lg border border-black/10 p-4 dark:border-white/10">
          <legend className="px-1 text-sm font-medium">Coordonnées (affichées aux clients)</legend>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            Ces informations apparaissent dans le pied de page du site, sur les reçus, et dans les
            courriels envoyés aux clients.
          </p>
          <label className="flex flex-col gap-1 text-sm">
            Courriel de contact public
            <input
              type="email"
              name="contactEmail"
              required
              defaultValue={settings.contactEmail}
              className="rounded border border-black/20 px-3 py-2 dark:border-white/20 dark:bg-black"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Téléphone
            <input
              name="contactPhone"
              required
              defaultValue={settings.contactPhone}
              className="rounded border border-black/20 px-3 py-2 dark:border-white/20 dark:bg-black"
            />
          </label>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <label className="flex flex-col gap-1 text-sm">
              Adresse (français)
              <input
                name="addressFr"
                required
                defaultValue={settings.addressFr}
                className="rounded border border-black/20 px-3 py-2 dark:border-white/20 dark:bg-black"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Adresse (anglais)
              <input
                name="addressEn"
                required
                defaultValue={settings.addressEn}
                className="rounded border border-black/20 px-3 py-2 dark:border-white/20 dark:bg-black"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Horaires (français)
              <input
                name="hoursFr"
                required
                defaultValue={settings.hoursFr}
                className="rounded border border-black/20 px-3 py-2 dark:border-white/20 dark:bg-black"
              />
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Horaires (anglais)
              <input
                name="hoursEn"
                required
                defaultValue={settings.hoursEn}
                className="rounded border border-black/20 px-3 py-2 dark:border-white/20 dark:bg-black"
              />
            </label>
          </div>
        </fieldset>

        <fieldset className="flex flex-col gap-4 rounded-lg border border-black/10 p-4 dark:border-white/10">
          <legend className="px-1 text-sm font-medium">Taxes</legend>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            Ces numéros et taux sont utilisés pour calculer et détailler les taxes sur chaque
            commande en ligne, vente en magasin, et reçu.
          </p>
          <label className="flex flex-col gap-1 text-sm">
            Numéro d&apos;inscription TPS (Canada)
            <input
              name="gstNumber"
              defaultValue={settings.gstNumber ?? ""}
              placeholder="123456789 RT0001"
              className="rounded border border-black/20 px-3 py-2 dark:border-white/20 dark:bg-black"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Taux de TPS (%)
            <input
              type="number"
              name="gstRatePercent"
              min={0}
              max={100}
              step="0.001"
              defaultValue={Number(settings.gstRatePercent)}
              className="rounded border border-black/20 px-3 py-2 dark:border-white/20 dark:bg-black"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Numéro d&apos;inscription TVQ (Québec)
            <input
              name="qstNumber"
              defaultValue={settings.qstNumber ?? ""}
              placeholder="1234567890 TQ0001"
              className="rounded border border-black/20 px-3 py-2 dark:border-white/20 dark:bg-black"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Taux de TVQ (%)
            <input
              type="number"
              name="qstRatePercent"
              min={0}
              max={100}
              step="0.001"
              defaultValue={Number(settings.qstRatePercent)}
              className="rounded border border-black/20 px-3 py-2 dark:border-white/20 dark:bg-black"
            />
          </label>
        </fieldset>

        <button
          type="submit"
          className="w-fit rounded bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          Enregistrer
        </button>
      </form>
    </div>
  );
}
