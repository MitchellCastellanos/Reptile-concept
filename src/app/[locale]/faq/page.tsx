import { getTranslations } from "next-intl/server";

const QUESTION_KEYS = [
  "pickup",
  "shipping",
  "payment",
  "healthGuarantee",
  "care",
  "returns",
  "afterSale",
] as const;

export default async function FaqPage() {
  const t = await getTranslations("Faq");

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-8 px-6 py-12">
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
