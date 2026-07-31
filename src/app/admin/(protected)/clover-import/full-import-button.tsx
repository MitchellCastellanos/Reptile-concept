"use client";

import { useActionState } from "react";
import { importFullCatalogAction } from "./actions";

export function FullImportButton() {
  const [state, formAction, pending] = useActionState(importFullCatalogAction, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded border border-black/20 px-3 py-1.5 text-sm font-medium disabled:opacity-50 dark:border-white/20"
      >
        {pending ? "Import en cours..." : "Importer tout le catalogue Clover"}
      </button>
      <p className="text-xs text-zinc-500">
        À utiliser une fois pour faire apparaître les articles déjà présents dans Clover avant la
        connexion (ceux capturés après aujourd&apos;hui arrivent automatiquement). Sans risque à
        relancer plusieurs fois.
      </p>
      {state?.error ? <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p> : null}
      {state && !state.error ? (
        <p className="text-sm text-green-700 dark:text-green-400">
          {state.totalItems} article(s) trouvé(s) dans Clover — {state.alreadyLinked} déjà relié(s)
          mis à jour, {state.autoCreated} créé(s) automatiquement (règle enregistrée), {state.queued}{" "}
          ajouté(s) à la file ci-dessous.
        </p>
      ) : null}
    </form>
  );
}
