import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { PaymentBadges } from "@/components/payment-badges";

// The original home hero, preserved as-is. Selected via HOME_HERO_VARIANT in
// src/lib/home-hero.ts (and used automatically once the launch offer ends).
export async function ClassicHero() {
  const t = await getTranslations("Home");

  return (
    <section className="relative flex min-h-[420px] items-center overflow-hidden xl:min-h-[480px] 2xl:min-h-[540px]">
      <Image
        src="/images/hero.jpg"
        alt="Reptiles Concept"
        fill
        priority
        className="object-cover object-center xl:object-[center_42%] 2xl:object-[center_34%]"
        sizes="100vw"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/70 to-primary/30" />
      <div className="relative mx-auto w-full max-w-6xl px-6 py-20">
        <p className="mb-2 text-sm font-medium uppercase tracking-widest text-white/80">
          Lachine, Québec
        </p>
        <h1 className="max-w-xl text-4xl font-bold tracking-tight text-white sm:text-5xl">
          {t("title")}
        </h1>
        <p className="mt-4 max-w-lg text-lg text-white/90">{t("tagline")}</p>
        <div className="mt-8 flex flex-wrap gap-3">
          <Link
            href="/animals"
            className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-primary transition hover:bg-accent-light"
          >
            {t("ctaAnimals")}
          </Link>
          <Link
            href="/boutique"
            className="rounded-full border-2 border-white px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
          >
            {t("ctaShop")}
          </Link>
        </div>
        <PaymentBadges variant="onDark" className="mt-8" />
      </div>
    </section>
  );
}
