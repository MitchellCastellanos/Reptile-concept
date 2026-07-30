"use client";

import { useActionState } from "react";
import { syncCloverNowAction } from "./actions";

export function CloverSyncNowButton() {
  const [state, formAction, pending] = useActionState(syncCloverNowAction, undefined);

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded border border-black/20 px-3 py-1.5 text-sm font-medium disabled:opacity-50 dark:border-white/20"
      >
        {pending ? "Synchronisation..." : "Synchroniser maintenant"}
      </button>
      {state?.error ? <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p> : null}
      {state && !state.error ? (
        <p className="text-sm text-green-700 dark:text-green-400">
          {state.checked} commande(s) Clover vérifiée(s), {state.processed} nouvelle(s) synchronisée(s).
        </p>
      ) : null}
    </form>
  );
}
