import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { Link } from "@/i18n/navigation";
import { getAnimalById } from "@/lib/queries";
import { getAnimalImageUrl } from "@/lib/images";
import { AddAnimalToCartButton } from "@/components/add-to-cart-button";
import { PaymentBadges } from "@/components/payment-badges";
import { KlarnaInstallments } from "@/components/klarna-installments";

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
  const imageUrl = getAnimalImageUrl(animal.species.id, animal.media);

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-6 py-12">
      <Link href="/animals" className="w-fit text-sm font-medium text-primary hover:underline">
        &larr; {t("backToList")}
      </Link>

      <div className="grid gap-8 md:grid-cols-2">
        <div className="relative aspect-square overflow-hidden rounded-2xl border border-border bg-accent-light shadow-sm">
          <Image
            src={imageUrl}
            alt={`${speciesName} — ${animal.morph}`}
            fill
            className="object-cover"
            sizes="(max-width: 768px) 100vw, 50vw"
            priority
          />
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-accent">{speciesName}</p>
            <h1 className="text-3xl font-bold tracking-tight">{animal.morph}</h1>
          </div>

          <div className="flex flex-wrap gap-2">
            <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-medium text-primary">
              {t(`status_${animal.status}`)}
            </span>
            <span className="rounded-full bg-accent-light px-3 py-1 text-sm font-medium text-accent">
              {t(`sex_${animal.sex}`)}
            </span>
          </div>

          <div>
            <p className="text-2xl font-bold text-primary">
              {home("priceLabel")}: {Number(animal.priceCAD)} $ CAD
            </p>
            <KlarnaInstallments priceCAD={Number(animal.priceCAD)} className="mt-1" />
          </div>

          <p className="whitespace-pre-line leading-relaxed text-muted">{description}</p>

          {animal.status === "available" ? (
            <>
              <AddAnimalToCartButton
                id={animal.id}
                name={`${speciesName} — ${animal.morph}`}
                priceCAD={Number(animal.priceCAD)}
              />
              <PaymentBadges />
            </>
          ) : null}
        </div>
      </div>
    </main>
  );
}
