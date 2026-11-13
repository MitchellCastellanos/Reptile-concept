"use client";

import { useActionState } from "react";
import Image from "next/image";
import { useLocale, useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { PaymentBadges } from "@/components/payment-badges";
import { subscribeToNewsletterAction } from "./newsletter-actions";

// Grand-opening home hero (replaces the classic hero while the welcome offer is
// active — see src/lib/home-hero.ts). Separate art per breakpoint: wide 3:1 on
// xl+, portrait 4:5 stacked under the text below xl so nothing covers the gecko.
export function LaunchHero({
  percentOff,
  code,
  validUntil,
}: {
  percentOff: number;
  code: string;
  validUntil: string | null;
}) {
  const t = useTranslations("LaunchBanner");
  const tHome = useTranslations("Home");
  const locale = useLocale() as "fr" | "en";
  const [state, formAction, pending] = useActionState(
    subscribeToNewsletterAction.bind(null, locale),
    undefined,
  );

  return (
    <section
      aria-labelledby="launch-hero-title"
      className="relative isolate overflow-hidden bg-primary text-white xl:flex xl:min-h-[520px] xl:items-center 2xl:min-h-[560px]"
    >
      <Image
        src="/images/launch-banner-desktop.webp"
        alt=""
        fill
        priority
        sizes="100vw"
        className="-z-20 hidden object-cover object-right xl:block"
      />
      <div className="absolute inset-0 -z-10 hidden bg-gradient-to-r from-primary/95 via-primary/70 to-transparent xl:block" />

      <div className="mx-auto w-full max-w-6xl px-6 pb-6 pt-10 xl:py-10">
        <div className="max-w-xl">
          <p className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold uppercase tracking-widest backdrop-blur-sm">
            <span aria-hidden="true">🎉</span>
            {t("kicker")}
          </p>

          <h1
            id="launch-hero-title"
            className="mt-4 font-display text-4xl font-extrabold leading-[1.05] tracking-tight sm:text-5xl"
          >
            {t("title")}
          </h1>

          <p className="mt-4 flex flex-wrap items-baseline gap-x-3 gap-y-1">
            <span className="font-display text-5xl font-extrabold leading-none text-accent-light xl:text-6xl">
              -{percentOff}&nbsp;%
            </span>
            <span className="text-lg font-medium text-white/95 xl:text-xl">{t("offerLine")}</span>
          </p>
          <p className="mt-2 text-base text-white/90">{t("subscribe")}</p>

          <div className="mt-5 max-w-md">
            {state?.success ? (
              <p role="status" className="rounded-2xl bg-white/15 px-4 py-3 text-sm backdrop-blur-sm">
                {t("success", { code })}
              </p>
            ) : (
              <form action={formAction} className="flex flex-col gap-3">
                <input
                  type="email"
                  name="email"
                  required
                  aria-label={t("placeholder")}
                  placeholder={t("placeholder")}
                  className="min-w-0 rounded-full border border-white/40 bg-white px-5 py-3 text-sm text-foreground placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-white/60"
                />
                <button
                  type="submit"
                  disabled={pending}
                  className="w-full rounded-full bg-accent px-6 py-3.5 text-base font-bold text-white shadow-lg transition hover:brightness-110 disabled:opacity-50"
                >
                  {t("submit")}
                </button>
                {state?.error ? <p className="text-xs text-white">{t("error")}</p> : null}
              </form>
            )}
          </div>

          <p className="mt-4 max-w-md text-xs text-white/85">
            {validUntil ? `${t("validUntil", { date: validUntil })} ` : ""}
            {t("fineprint")}
          </p>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href="/animals"
              className="rounded-full bg-white px-5 py-2.5 text-sm font-semibold text-primary transition hover:bg-accent-light"
            >
              {tHome("ctaAnimals")}
            </Link>
            <Link
              href="/boutique"
              className="rounded-full border-2 border-white px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              {tHome("ctaShop")}
            </Link>
          </div>
          <PaymentBadges variant="onDark" className="mt-4" />
        </div>
      </div>

      <div className="relative h-80 sm:h-96 xl:hidden">
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
