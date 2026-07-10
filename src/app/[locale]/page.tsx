import { getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { getAvailableAnimals } from "@/lib/queries";

export default async function Home() {
  const t = await getTranslations("Home");
  const animals = await getAvailableAnimals();
  const featured = animals.slice(0, 3);

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-10 px-6 py-12">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="mt-2 text-lg text-zinc-600 dark:text-zinc-400">{t("tagline")}</p>
      </div>

      <section className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-medium">{t("availableAnimals")}</h2>
          <Link href="/animals" className="text-sm font-medium underline">
            {t("viewAllAnimals")}
          </Link>
        </div>

        {featured.length === 0 ? (
          <p className="text-zinc-600 dark:text-zinc-400">{t("noAnimals")}</p>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {featured.map((animal) => (
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
      </section>

      <Link
        href="/boutique"
        className="w-fit rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background"
      >
        {t("shopAccessories")}
      </Link>
    </main>
  );
}
