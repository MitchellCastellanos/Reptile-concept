"use client";

import { useActionState } from "react";
import { updateSettingsAction } from "./actions";
import { BusinessHoursFields } from "./business-hours-fields";
import type { WeeklyHours } from "@/lib/business-hours";

export function SettingsForm({
  settings,
  weeklyHours,
}: {
  settings: {
    pickupDeadlineBusinessDays: number;
    cancellationFeePercent: number;
    adminNotificationEmail: string | null;
    contactEmail: string;
    contactPhone: string;
    addressFr: string;
    addressEn: string;
    gstNumber: string | null;
    gstRatePercent: number;
    qstNumber: string | null;
    qstRatePercent: number;
  };
  weeklyHours: WeeklyHours;
}) {
  const [state, formAction, pending] = useActionState(updateSettingsAction, undefined);

  return (
    <form action={formAction} className="flex max-w-2xl flex-col gap-4">
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
          defaultValue={settings.cancellationFeePercent}
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
        </div>

        <div className="flex flex-col gap-2">
          <span className="text-sm font-medium">Horaires d&apos;ouverture</span>
          <p className="text-xs text-zinc-600 dark:text-zinc-400">
            Réglez l&apos;heure d&apos;ouverture et de fermeture pour chaque jour, ou cochez
            « Fermé ». Le texte affiché aux clients (pied de page, reçus, courriels) est généré
            automatiquement à partir de cet horaire, en français et en anglais.
          </p>
          <BusinessHoursFields defaultWeeklyHours={weeklyHours} />
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
            defaultValue={settings.gstRatePercent}
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
            defaultValue={settings.qstRatePercent}
            className="rounded border border-black/20 px-3 py-2 dark:border-white/20 dark:bg-black"
          />
        </label>
      </fieldset>

      {state?.error ? <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p> : null}
      {state?.success ? <p className="text-sm text-green-700 dark:text-green-400">{state.success}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
      >
        {pending ? "..." : "Enregistrer"}
      </button>
    </form>
  );
}
