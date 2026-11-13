"use client";

import { useActionState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { subscribeToNewsletterAction } from "./newsletter-actions";

// Home-page launch banner, a second "hero" shown under the main one: "we're
// open" + welcome offer for newsletter signups. Separate art per breakpoint
// (wide 3:1 on md+, portrait 4:5 on mobile); text sits on the dark-green side.
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
    <section
      aria-labelledby="launch-banner-title"
      className="relative isolate overflow-hidden bg-primary text-white lg:flex lg:min-h-[420px] lg:items-center xl:min-h-[460px]"
    >
      {/* Wide art (lg+): gecko on the right, text over the dark-green left. */}
      <Image
        src="/images/launch-banner-desktop.webp"
        alt=""
        fill
        sizes="100vw"
        className="-z-20 hidden object-cover object-right lg:block"
      />
      <div className="absolute inset-0 -z-10 hidden bg-gradient-to-r from-primary/95 via-primary/70 to-transparent lg:block" />

      <div className="mx-auto w-full max-w-6xl px-6 pb-6 pt-10 lg:py-16">
        <div className="max-w-xl">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-widest backdrop-blur-sm">
            <span aria-hidden="true">🎉</span>
            {t("kicker")}
          </p>

          <h2
            id="launch-banner-title"
            className="mt-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl"
          >
            {t("title")}
          </h2>

          <p className="mt-5 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="text-5xl font-extrabold leading-none text-accent-light lg:text-6xl">
              -{percentOff}&nbsp;%
            </span>
            <span className="text-lg font-medium text-white/95 lg:text-xl">{t("offerLine")}</span>
          </p>
          <p className="mt-2 text-base text-white/90">{t("subscribe")}</p>

          <div className="mt-6 max-w-md">
            {state?.success ? (
              <p role="status" className="rounded-2xl bg-white/15 px-4 py-3 text-sm backdrop-blur-sm">
                {t("success", { code })}
              </p>
            ) : (
              <form action={formAction} className="flex flex-col gap-2">
                <div className="flex flex-col gap-3">
                  <input
                    type="email"
                    name="email"
                    required
                    aria-label={t("placeholder")}
                    placeholder={t("placeholder")}
                    className="min-w-0 flex-1 rounded-full border border-white/40 bg-white px-5 py-3 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-white/60"
                  />
                  <button
                    type="submit"
                    disabled={pending}
                    className="w-full rounded-full bg-accent px-6 py-3.5 text-base font-bold text-white shadow-lg transition hover:brightness-110 disabled:opacity-50"
                  >
                    {t("submit")}
                  </button>
                </div>
                {state?.error ? <p className="text-xs text-white">{t("error")}</p> : null}
              </form>
            )}
          </div>

          <p className="mt-4 max-w-md text-xs text-white/85">
            {validUntil ? `${t("validUntil", { date: validUntil })} ` : ""}
            {t("fineprint")}
          </p>
        </div>
      </div>

      {/* Portrait art (below lg): shown under the text so nothing covers the gecko. */}
      <div className="relative h-80 sm:h-96 lg:hidden">
        <Image
          src="/images/launch-banner-mobile.webp"
          alt=""
          fill
          sizes="100vw"
          className="object-cover object-[50%_62%]"
        />
        <div className="absolute inset-x-0 top-0 h-28 bg-gradient-to-b from-primary to-transparent" />
      </div>
    </section>
  );
}
