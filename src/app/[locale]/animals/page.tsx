import { getLocale, getTranslations } from "next-intl/server";
import { AnimalCard } from "@/components/animal-card";
import { getAvailableAnimals } from "@/lib/queries";

export default async function AnimalsPage() {
  const t = await getTranslations("Home");
  const locale = await getLocale();
  const animals = await getAvailableAnimals();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{t("availableAnimals")}</h1>
        <p className="mt-2 text-muted">{t("animalsSubtitle")}</p>
      </div>

      {animals.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <p className="text-4xl">🦎</p>
          <p className="mt-4 text-muted">{t("noAnimals")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {animals.map((animal) => (
            <AnimalCard
              key={animal.id}
              animal={animal}
              locale={locale}
              priceLabel={t("priceLabel")}
              availableLabel={t("available")}
            />
          ))}
        </div>
      )}
    </main>
  );
}
