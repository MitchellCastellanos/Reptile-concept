"use client";

import { useActionState } from "react";
import { createCustomerAction, importCustomersCsvAction } from "../actions";

export function NewCustomerForm() {
  const [state, formAction, pending] = useActionState(createCustomerAction, undefined);

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        Nom complet
        <input
          name="fullName"
          required
          className="rounded border border-black/20 px-3 py-2 dark:border-white/20 dark:bg-black"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Courriel
        <input
          name="email"
          type="email"
          required
          className="rounded border border-black/20 px-3 py-2 dark:border-white/20 dark:bg-black"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Téléphone
        <input
          name="phone"
          className="rounded border border-black/20 px-3 py-2 dark:border-white/20 dark:bg-black"
        />
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Langue préférée
        <select
          name="preferredLang"
          defaultValue="fr"
          className="rounded border border-black/20 px-3 py-2 dark:border-white/20 dark:bg-black"
        >
          <option value="fr">Français</option>
          <option value="en">English</option>
        </select>
      </label>
      {state?.error ? <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p> : null}
      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
      >
        {pending ? "..." : "Ajouter le client"}
      </button>
    </form>
  );
}

export function ImportCustomersCsvForm() {
  const [state, formAction, pending] = useActionState(importCustomersCsvAction, undefined);

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        Fichier CSV ou Excel (export QuickBooks ou Excel)
        <input
          name="csvFile"
          type="file"
          accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
          required
          className="rounded border border-black/20 px-3 py-2 dark:border-white/20 dark:bg-black"
        />
      </label>
      <p className="text-xs text-zinc-500">
        Formats acceptés : CSV ou Excel (.xlsx). Si votre fichier est un ancien classeur Excel
        (.xls) enregistré avec une extension .csv, ouvrez-le dans Excel et enregistrez-le en
        .xlsx ou en CSV UTF-8 avant de l&apos;importer. Colonnes reconnues (en-tête requis pour
        &laquo;&nbsp;courriel&nbsp;&raquo;, les autres sont optionnelles) :
        Nom, Nom de l&apos;entreprise, Adresse municipale, Ville, Province, Pays, Code postal,
        Téléphone, Courriel, Type de client, Pièces jointes, Solde courant. Les clients
        existants (même courriel) sont mis à jour, pas dupliqués.
      </p>
      {state?.error ? <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p> : null}
      {state && !state.error ? (
        <p className="text-sm text-green-700 dark:text-green-400">
          {state.imported} client(s) importé(s), {state.skipped} ligne(s) ignorée(s).
        </p>
      ) : null}
      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
      >
        {pending ? "..." : "Importer"}
      </button>
    </form>
  );
}
