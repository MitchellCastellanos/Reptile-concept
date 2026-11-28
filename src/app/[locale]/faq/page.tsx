import { getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import { getTranslations as getMetaTranslations } from "next-intl/server";
import { buildPageMetadata, jsonLdString } from "@/lib/seo";

const QUESTION_KEYS = [
  "pickup",
  "shipping",
  "payment",
  "healthGuarantee",
  "care",
  "returns",
  "afterSale",
] as const;

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getMetaTranslations({ locale, namespace: "Faq" });
  return buildPageMetadata({ locale, path: "/faq", title: t("title"), description: t("subtitle") });
}

export default async function FaqPage() {
  const t = await getTranslations("Faq");

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-12">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdString({
            "@context": "https://schema.org",
            "@type": "FAQPage",
            mainEntity: QUESTION_KEYS.map((key) => ({
              "@type": "Question",
              name: t(`${key}_q`),
              acceptedAnswer: { "@type": "Answer", text: t(`${key}_a`) },
            })),
          }),
        }}
      />
      <div>
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="mt-2 text-muted">{t("subtitle")}</p>
      </div>

      <div className="flex flex-col gap-4">
        {QUESTION_KEYS.map((key) => (
          <div key={key} className="rounded-2xl border border-border bg-card p-5 shadow-sm">
            <h2 className="font-semibold text-foreground">{t(`${key}_q`)}</h2>
            <p className="mt-2 text-sm leading-relaxed text-muted">{t(`${key}_a`)}</p>
          </div>
        ))}
      </div>
    </main>
  );
}
