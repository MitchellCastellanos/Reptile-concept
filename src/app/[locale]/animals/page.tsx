import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getAvailableAnimals } from "@/lib/queries";

export default async function AnimalsPage() {
  const t = await getTranslations("Home");
  const animals = await getAvailableAnimals();

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">{t("availableAnimals")}</h1>

      {animals.length === 0 ? (
        <p className="text-zinc-600 dark:text-zinc-400">{t("noAnimals")}</p>
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
          {animals.map((animal) => (
            <Link
              key={animal.id}
              href={`/animals/${animal.id}`}
              className="rounded-lg border border-black/10 p-4 transition hover:border-black/30 dark:border-white/10 dark:hover:border-white/30"
            >
              <p className="text-xs uppercase tracking-wide text-zinc-500">
                {animal.species.commonNameFr} / {animal.species.commonNameEn}
              </p>
              <p className="mt-1 font-medium">{animal.morph}</p>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                {t("priceLabel")}: {Number(animal.priceCAD)} $ CAD
              </p>
            </Link>
          ))}
        </div>
      )}
    </main>
  );
}
