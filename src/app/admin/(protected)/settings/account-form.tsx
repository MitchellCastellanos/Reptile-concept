"use client";

import { useActionState } from "react";
import { updateAccountAction } from "./actions";

export function AccountForm({ currentEmail }: { currentEmail: string }) {
  const [state, formAction, pending] = useActionState(updateAccountAction, undefined);

  return (
    <form action={formAction} className="flex max-w-md flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        Courriel de connexion
        <input
          type="email"
          name="newEmail"
          required
          defaultValue={currentEmail}
          className="rounded border border-black/20 px-3 py-2 dark:border-white/20 dark:bg-black"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Nouveau mot de passe
        <input
          type="password"
          name="newPassword"
          autoComplete="new-password"
          placeholder="Laisser vide pour ne pas changer"
          className="rounded border border-black/20 px-3 py-2 dark:border-white/20 dark:bg-black"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Confirmer le nouveau mot de passe
        <input
          type="password"
          name="confirmPassword"
          autoComplete="new-password"
          className="rounded border border-black/20 px-3 py-2 dark:border-white/20 dark:bg-black"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Mot de passe actuel (requis pour confirmer)
        <input
          type="password"
          name="currentPassword"
          required
          autoComplete="current-password"
          className="rounded border border-black/20 px-3 py-2 dark:border-white/20 dark:bg-black"
        />
      </label>

      {state?.error ? <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p> : null}
      {state?.success ? <p className="text-sm text-green-700 dark:text-green-400">{state.success}</p> : null}

      <button
        type="submit"
        disabled={pending}
        className="w-fit rounded bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
      >
        {pending ? "..." : "Mettre à jour le compte"}
      </button>
    </form>
  );
}
