import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { getAnimalById } from "@/lib/queries";
import { AddAnimalToCartButton } from "@/components/add-to-cart-button";

export default async function AnimalDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const animal = await getAnimalById(id);
  if (!animal) notFound();

  const locale = await getLocale();
  const t = await getTranslations("Animal");
  const home = await getTranslations("Home");
  const description = locale === "en" ? animal.descriptionEn : animal.descriptionFr;
  const speciesName =
    locale === "en" ? animal.species.commonNameEn : animal.species.commonNameFr;

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-12">
      <Link href="/animals" className="text-sm font-medium underline w-fit">
        &larr; {t("backToList")}
      </Link>

      <div>
        <p className="text-xs uppercase tracking-wide text-zinc-500">{speciesName}</p>
        <h1 className="text-3xl font-semibold tracking-tight">{animal.morph}</h1>
      </div>

      <div className="flex gap-4 text-sm text-zinc-600 dark:text-zinc-400">
        <span>{t(`status_${animal.status}`)}</span>
        <span>&middot;</span>
        <span>{t(`sex_${animal.sex}`)}</span>
      </div>

      <p className="text-lg font-medium">
        {home("priceLabel")}: {Number(animal.priceCAD)} $ CAD
      </p>

      <p className="whitespace-pre-line text-zinc-700 dark:text-zinc-300">{description}</p>

      {animal.status === "available" ? (
        <AddAnimalToCartButton
          id={animal.id}
          name={`${speciesName} — ${animal.morph}`}
          priceCAD={Number(animal.priceCAD)}
        />
      ) : null}
    </main>
  );
}
