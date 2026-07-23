import { getStoreSettings } from "@/lib/settings";
import { updateSettingsAction } from "./actions";

export default async function AdminSettingsPage() {
  const settings = await getStoreSettings();

  return (
    <div className="flex flex-col gap-6">
      <h1 className="text-2xl font-semibold">Réglages</h1>

      <form action={updateSettingsAction} className="flex max-w-md flex-col gap-4">
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
