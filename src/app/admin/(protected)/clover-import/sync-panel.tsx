"use client";

import { useActionState } from "react";
import { syncCloverAction, previewMissingAction } from "./actions";

export function CloverSyncPanel({
  lastSyncedAt,
  credentialsConfigured,
  verificationCode,
}: {
  lastSyncedAt: string | null;
  credentialsConfigured: boolean;
  verificationCode: string | null;
}) {
  const [state, formAction, pending] = useActionState(syncCloverAction, undefined);
  const [preview, previewAction, previewPending] = useActionState(previewMissingAction, undefined);

  return (
    <div>
      <form action={formAction} className="flex flex-col gap-2">
        <h2 className="text-lg font-medium">Synchronisation avec Clover</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Clover est la source de vérité : prix, stock et ventes en magasin y sont modifiés, puis
          reflétés sur le site automatiquement (webhook + vérification automatique régulière). Ce bouton
          force la même vérification tout de suite, en plus de repérer les articles Clover qui n&apos;ont
          pas encore de fiche sur le site (ils s&apos;ajoutent à la file ci-dessous).
        </p>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Dernière synchronisation : {lastSyncedAt ?? "jamais"} — identifiants Clover :{" "}
          <span className={credentialsConfigured ? "text-green-700 dark:text-green-400" : "text-red-600 dark:text-red-400"}>
            {credentialsConfigured ? "configurés" : "non configurés"}
          </span>
        </p>
        {verificationCode ? (
          <p className="text-xs text-zinc-500">
            Code de vérification du webhook (à coller dans le Developer Dashboard de Clover lors de sa
            configuration) :{" "}
            <code className="rounded bg-black/5 px-1.5 py-0.5 dark:bg-white/10">{verificationCode}</code>
          </p>
        ) : null}
        <button
          type="submit"
          disabled={pending}
          className="w-fit rounded border border-black/20 px-3 py-1.5 text-sm font-medium disabled:opacity-50 dark:border-white/20"
        >
          {pending ? "Synchronisation en cours..." : "Synchroniser avec Clover"}
        </button>
        {state?.error ? <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p> : null}
        {state && !state.error ? (
          <ul className="list-disc pl-5 text-sm text-green-700 dark:text-green-400">
            <li>
              Ventes : {state.ordersChecked} commande(s) vérifiée(s), {state.ordersProcessed} nouvelle(s)
              vente(s) appliquée(s) au site.
            </li>
            <li>
              Articles déjà reliés : {state.alreadyLinked} vérifié(s) — {state.pricesUpdated} prix et{" "}
              {state.stockUpdated} stock(s) mis à jour.
            </li>
            {state.missing ? (
              <li className="text-amber-700 dark:text-amber-400">
                {state.missing} article(s) relié(s) introuvable(s) dans Clover : {state.removed} retiré(s) du site
                {state.missing > (state.removed ?? 0)
                  ? `, ${state.missing - (state.removed ?? 0)} en attente (relancez la synchronisation) ou non confirmé(s)`
                  : ""}
                .
              </li>
            ) : null}
            <li>
              Nouveaux articles Clover : {state.queued} ajouté(s) à la file, {state.autoCreated} produit(s) et{" "}
              {state.autoCreatedAnimals ?? 0} animal(aux) créé(s) par règle.
            </li>
            <li>{state.totalItems} article(s) au total dans Clover.</li>
          </ul>
        ) : null}
      </form>
      <form action={previewAction} className="mt-4 flex flex-col gap-2">
        <button
          type="submit"
          disabled={previewPending}
          className="w-fit rounded border border-black/20 px-3 py-1.5 text-sm disabled:opacity-50 dark:border-white/20"
        >
          {previewPending ? "Vérification..." : "Voir les articles qui seraient retirés (sans rien modifier)"}
        </button>
        <p className="text-xs text-zinc-500">
          Articles du site dont l&apos;article Clover n&apos;existe plus. La synchronisation les retire du site ;
          ce bouton ne fait que les lister.
        </p>
        {preview?.error ? <p className="text-sm text-red-600 dark:text-red-400">{preview.error}</p> : null}
        {preview && !preview.error && preview.complete === false ? (
          <p className="text-sm text-amber-700 dark:text-amber-400">
            Le catalogue Clover n&apos;a pas pu être lu en entier — liste non fiable, réessayez.
          </p>
        ) : null}
        {preview && !preview.error && preview.complete !== false ? (
          <div className="text-sm">
            <p>
              {preview.items?.length ?? 0} article(s) confirmé(s) supprimé(s) de Clover
              {preview.unconfirmed ? ` (${preview.unconfirmed} autre(s) non confirmé(s), ignoré(s))` : ""}.
            </p>
            {preview.items?.length ? (
              <ol className="mt-1 list-decimal pl-5">
                {preview.items.map((item) => (
                  <li key={item.cloverItemId}>
                    {item.name} — {item.priceCAD.toFixed(2)} $ ({item.kind === "animal" ? "animal" : "produit"})
                  </li>
                ))}
              </ol>
            ) : null}
          </div>
        ) : null}
      </form>
    </div>
  );
}