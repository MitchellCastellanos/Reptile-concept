"use client";

import { useActionState } from "react";
import { subscribeToNewsletterAction } from "./newsletter-actions";

const boundAction = subscribeToNewsletterAction.bind(null, "fr");

export function NewsletterGateForm() {
  const [state, formAction, pending] = useActionState(boundAction, undefined);

  return (
    <div className="mt-8 w-full max-w-md lg:mt-6">
      <p className="text-sm font-semibold text-white">
        Soyez les premiers informés · Be the first to know
      </p>
      <p className="mt-1 text-sm text-white/70">
        Laissez votre courriel pour être averti au lancement.
        <br />
        Leave your email to get notified when we launch.
      </p>

      {state?.success ? (
        <p className="mt-3 text-sm text-emerald-300">
          Merci — vous êtes inscrit! · Thanks — you&apos;re on the list!
        </p>
      ) : (
        <form action={formAction} className="mt-3 flex flex-col gap-2 sm:flex-row">
          <input
            type="email"
            name="email"
            required
            placeholder="Courriel / Email"
            className="min-w-0 flex-1 rounded-full border border-white/20 bg-white/5 px-4 py-2.5 text-sm text-white placeholder:text-white/50 outline-none focus:border-emerald-400/50"
          />
          <button
            type="submit"
            disabled={pending}
            className="shrink-0 rounded-full bg-emerald-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-emerald-500 disabled:opacity-50"
          >
            {pending ? "…" : "S'inscrire / Notify me"}
          </button>
        </form>
      )}
      {state?.error ? (
        <p className="mt-2 text-xs text-red-300">
          Courriel invalide / Invalid email
        </p>
      ) : null}
    </div>
  );
}
