import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { getAnimalById, getRelatedAnimals } from "@/lib/queries";
import { getAnimalImageUrl } from "@/lib/images";
import { getAnimalRatings } from "@/lib/ratings";
import { getSiteUrl } from "@/lib/site-url";
import { Breadcrumb } from "@/components/breadcrumb";
import { MediaGallery } from "@/components/media-gallery";
import { RatingStars } from "@/components/rating-stars";
import { AnimalCard } from "@/components/animal-card";
import { AddAnimalToCartButton } from "@/components/add-to-cart-button";
import { PaymentBadges } from "@/components/payment-badges";
import { KlarnaInstallments } from "@/components/klarna-installments";
import { WishlistToggleButton } from "@/components/wishlist-toggle-button";
import { SpeciesCareSheet } from "@/components/species-care-sheet";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { prisma } from "@/lib/db";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}): Promise<Metadata> {
  const { id, locale } = await params;
  const animal = await getAnimalById(id);
  if (!animal) return {};

  const speciesName = locale === "en" ? animal.species.commonNameEn : animal.species.commonNameFr;
  const title = `${speciesName} — ${animal.morph} | Reptiles Concept`;
  const description = locale === "en" ? animal.descriptionEn : animal.descriptionFr;
  const imageUrl = getAnimalImageUrl(animal.species.category, animal.media);
  const url = `${getSiteUrl()}/${locale}/animals/${animal.id}`;

  return {
    title,
    description: description?.slice(0, 160),
    alternates: { canonical: url },
    openGraph: {
      title,
      description: description?.slice(0, 160),
      url,
      images: [{ url: imageUrl }],
      type: "website",
    },
  };
}

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
  const tCategories = await getTranslations("NavCategories");
  const description = locale === "en" ? animal.descriptionEn : animal.descriptionFr;
  const speciesName =
    locale === "en" ? animal.species.commonNameEn : animal.species.commonNameFr;
  const galleryImages =
    animal.media.length > 0
      ? animal.media.map((m) => m.url)
      : [getAnimalImageUrl(animal.species.category, [])];

  const [customer, ratings, relatedAnimals] = await Promise.all([
    getCurrentCustomer(),
    getAnimalRatings([animal.id]),
    getRelatedAnimals(animal.species.category, animal.id),
  ]);
  const rating = ratings.get(animal.id);

  const isWishlisted = customer
    ? Boolean(
        await prisma.wishlistItem.findFirst({
          where: { customerId: customer.id, animalId: animal.id },
        }),
      )
    : false;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: `${speciesName} — ${animal.morph}`,
    description,
    image: galleryImages,
    offers: {
      "@type": "Offer",
      priceCurrency: "CAD",
      price: Number(animal.priceCAD),
      availability:
        animal.status === "available"
          ? "https://schema.org/InStock"
          : "https://schema.org/OutOfStock",
    },
    ...(rating
      ? {
          aggregateRating: {
            "@type": "AggregateRating",
            ratingValue: rating.average.toFixed(1),
            reviewCount: rating.count,
          },
        }
      : {}),
  };

  return (
    <main className="mx-auto flex w-full max-w-4xl flex-1 flex-col gap-8 px-6 py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <Breadcrumb
        items={[
          { label: home("availableAnimals"), href: "/animals" },
          { label: tCategories(animal.species.category), href: `/animals?category=${animal.species.category}` },
          { label: `${speciesName} — ${animal.morph}` },
        ]}
      />

      <div className="grid gap-8 md:grid-cols-2">
        <MediaGallery images={galleryImages} alt={`${speciesName} — ${animal.morph}`} />

        <div className="flex flex-col gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-accent">{speciesName}</p>
            <h1 className="text-3xl font-bold tracking-tight">{animal.morph}</h1>
          </div>

          {rating ? <RatingStars rating={rating.average} count={rating.count} /> : null}

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

          <p className="rounded-xl border border-border bg-accent-light px-4 py-3 text-sm text-foreground/80">
            {t("researchDisclaimer")}
          </p>

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
          <WishlistToggleButton type="animal" itemId={animal.id} initialActive={isWishlisted} />
        </div>
      </div>

      <SpeciesCareSheet species={animal.species} locale={locale} t={t} />

      {relatedAnimals.length > 0 ? (
        <section className="flex flex-col gap-4 border-t border-border pt-8">
          <h2 className="text-xl font-semibold text-foreground">{t("relatedTitle")}</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {relatedAnimals.map((related) => (
              <AnimalCard
                key={related.id}
                animal={related}
                locale={locale}
                priceLabel={home("priceLabel")}
                availableLabel={home("available")}
              />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
