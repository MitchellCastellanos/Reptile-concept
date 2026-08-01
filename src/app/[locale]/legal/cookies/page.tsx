import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";

export default async function CookiePolicyPage() {
  const t = await getTranslations("Legal");

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-12">
      <Link href="/" className="w-fit text-sm font-medium text-primary hover:underline">
        &larr; Reptiles Concept
      </Link>

      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{t("cookiePolicyTitle")}</h1>
        <p className="mt-3 text-muted">{t("cookiePolicyIntro")}</p>
      </div>

      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold text-foreground">{t("cookiePolicyWhatTitle")}</h2>
        <p className="text-muted">{t("cookiePolicyWhatBody")}</p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-xl font-semibold text-foreground">{t("cookiePolicyWhyTitle")}</h2>

        <div className="rounded-2xl border border-border bg-card p-4">
          <h3 className="font-semibold text-foreground">{t("cookiePolicyEssentialTitle")}</h3>
          <p className="mt-1 text-sm text-muted">{t("cookiePolicyEssentialBody")}</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <h3 className="font-semibold text-foreground">{t("cookiePolicyFunctionalTitle")}</h3>
          <p className="mt-1 text-sm text-muted">{t("cookiePolicyFunctionalBody")}</p>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4">
          <h3 className="font-semibold text-foreground">{t("cookiePolicyAnalyticsTitle")}</h3>
          <p className="mt-1 text-sm text-muted">{t("cookiePolicyAnalyticsBody")}</p>
        </div>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold text-foreground">{t("cookiePolicyControlTitle")}</h2>
        <p className="text-muted">{t("cookiePolicyControlBody")}</p>
      </section>

      <section className="flex flex-col gap-2">
        <h2 className="text-xl font-semibold text-foreground">{t("cookiePolicyContactTitle")}</h2>
        <p className="text-muted">{t("cookiePolicyContactBody")}</p>
      </section>
    </main>
  );
}
