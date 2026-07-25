"use client";

import { useActionState } from "react";
import { sendPosReceiptEmailAction, type SendReceiptResult } from "../../actions";

export function ReceiptEmailForm({
  posSaleId,
  defaultEmail,
}: {
  posSaleId: string;
  defaultEmail: string;
}) {
  const action = sendPosReceiptEmailAction.bind(null, posSaleId);
  const [state, formAction, pending] = useActionState<SendReceiptResult | undefined, FormData>(
    action,
    undefined,
  );

  return (
    <form action={formAction} className="no-print flex flex-wrap items-end gap-3 text-sm">
      <label className="flex flex-col gap-1">
        Envoyer le reçu par courriel
        <input
          type="email"
          name="email"
          required
          defaultValue={defaultEmail}
          placeholder="client@exemple.com"
          className="rounded border border-black/20 px-3 py-2 dark:border-white/20 dark:bg-black"
        />
      </label>
      <button
        type="submit"
        disabled={pending}
        className="rounded bg-foreground px-4 py-2 text-sm font-medium text-background disabled:opacity-50"
      >
        {pending ? "Envoi..." : "Envoyer"}
      </button>
      {state?.error ? <p className="text-red-600 dark:text-red-400">{state.error}</p> : null}
      {state?.success ? <p className="text-green-700 dark:text-green-400">Reçu envoyé.</p> : null}
    </form>
  );
}
