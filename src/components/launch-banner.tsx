"use client";

import { useActionState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { subscribeToNewsletterAction } from "./newsletter-actions";

// Home-page launch banner: "we're open" + welcome offer for newsletter signups.
export function LaunchBanner({
  percentOff,
  code,
  validUntil,
}: {
  percentOff: number;
  code: string;
  validUntil: string | null;
}) {
  const t = useTranslations("LaunchBanner");
  const locale = useLocale() as "fr" | "en";
  const [state, formAction, pending] = useActionState(
    subscribeToNewsletterAction.bind(null, locale),
    undefined,
  );

  return (
    <section aria-labelledby="launch-banner-title" className="bg-accent text-white">
      <div className="mx-auto flex w-full max-w-6xl flex-col items-center gap-6 px-6 py-8 md:flex-row md:gap-10 md:py-10">
        <div
          aria-hidden="true"
          className="flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-full bg-white text-accent shadow-lg md:h-28 md:w-28"
        >
          <span className="text-3xl font-extrabold leading-none md:text-4xl">-{percentOff}%</span>
          <span className="mt-1 text-[10px] font-semibold uppercase tracking-wider">{t("badge")}</span>
        </div>

        <div className="flex-1 text-center md:text-left">
          <p className="text-xs font-semibold uppercase tracking-widest text-white">{t("kicker")}</p>
          <h2 id="launch-banner-title" className="mt-1 text-2xl font-bold tracking-tight md:text-3xl">
            {t("title")}
          </h2>
          <p className="mt-2 text-base text-white/90">{t("offer", { percent: percentOff })}</p>
          <p className="mt-2 text-xs text-white">
            {validUntil ? `${t("validUntil", { date: validUntil })} ` : ""}
            {t("fineprint")}
          </p>
        </div>

        <div className="w-full md:w-96">
          {state?.success ? (
            <p role="status" className="rounded-2xl bg-white/15 px-4 py-3 text-sm">
              {t("success", { code })}
            </p>
          ) : (
            <form action={formAction} className="flex flex-col gap-2">
              <div className="flex flex-col gap-2 sm:flex-row">
                <input
                  type="email"
                  name="email"
                  required
                  aria-label={t("placeholder")}
                  placeholder={t("placeholder")}
                  className="min-w-0 flex-1 rounded-full border border-white/40 bg-white px-4 py-3 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-white/60"
                />
                <button
                  type="submit"
                  disabled={pending}
                  className="shrink-0 rounded-full bg-primary px-5 py-3 text-sm font-semibold text-white transition hover:bg-primary-light disabled:opacity-50"
                >
                  {t("submit")}
                </button>
              </div>
              {state?.error ? <p className="text-xs text-white/90">{t("error")}</p> : null}
            </form>
          )}
        </div>
      </div>
    </section>
  );
}
