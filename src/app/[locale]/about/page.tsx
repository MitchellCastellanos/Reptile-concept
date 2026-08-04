import Image from "next/image";
import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function AboutPage() {
  const t = await getTranslations("About");

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="mt-2 text-muted">{t("subtitle")}</p>
      </div>

      <div className="relative aspect-[16/9] overflow-hidden rounded-2xl border border-border bg-accent-light shadow-sm">
        <Image src="/images/hero.jpg" alt="" fill className="object-cover" sizes="100vw" />
      </div>

      <div className="flex flex-col gap-4 text-sm leading-relaxed text-foreground/90">
        <p>{t("story")}</p>
        <p>{t("mission")}</p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-border bg-card p-5 text-center shadow-sm">
          <p className="font-semibold text-foreground">{t("value_breeding_title")}</p>
          <p className="mt-1 text-sm text-muted">{t("value_breeding_body")}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 text-center shadow-sm">
          <p className="font-semibold text-foreground">{t("value_advice_title")}</p>
          <p className="mt-1 text-sm text-muted">{t("value_advice_body")}</p>
        </div>
        <div className="rounded-2xl border border-border bg-card p-5 text-center shadow-sm">
          <p className="font-semibold text-foreground">{t("value_community_title")}</p>
          <p className="mt-1 text-sm text-muted">{t("value_community_body")}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-3">
        <Link
          href="/animals"
          className="rounded-full bg-primary px-5 py-2.5 text-sm font-semibold text-white hover:bg-primary-light"
        >
          {t("cta")}
        </Link>
        <Link
          href="/faq"
          className="rounded-full border border-border px-5 py-2.5 text-sm font-semibold text-foreground hover:border-primary/50"
        >
          {t("faqCta")}
        </Link>
      </div>
    </main>
  );
}
