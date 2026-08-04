"use client";

import { useActionState } from "react";
import { useTranslations, useLocale } from "next-intl";
import { subscribeToNewsletterAction } from "./newsletter-actions";

export function NewsletterSignupForm() {
  const t = useTranslations("Footer");
  const locale = useLocale() as "fr" | "en";
  const boundAction = subscribeToNewsletterAction.bind(null, locale);
  const [state, formAction, pending] = useActionState(boundAction, undefined);

  if (state?.success) {
    return <p className="text-sm text-white/90">{t("newsletterSuccess")}</p>;
  }

  return (
    <form action={formAction} className="flex flex-col gap-2">
      <p className="text-sm text-white/80">{t("newsletterBody")}</p>
      <div className="flex gap-2">
        <input
          type="email"
          name="email"
          required
          placeholder={t("newsletterPlaceholder")}
          className="min-w-0 flex-1 rounded-full border border-white/30 bg-white/10 px-4 py-2 text-sm text-white placeholder:text-white/60 focus:outline-none focus:ring-2 focus:ring-white/40"
        />
        <button
          type="submit"
          disabled={pending}
          className="shrink-0 rounded-full bg-white px-4 py-2 text-sm font-semibold text-primary hover:bg-accent-light disabled:opacity-50"
        >
          {t("newsletterSubmit")}
        </button>
      </div>
      {state?.error ? <p className="text-xs text-white/70">{t("newsletterError")}</p> : null}
    </form>
  );
}
