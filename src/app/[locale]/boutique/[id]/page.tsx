import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import { notFound } from "next/navigation";
import { getProductById, getRelatedProducts } from "@/lib/queries";
import { getProductImageUrl } from "@/lib/images";
import { getProductRatings } from "@/lib/ratings";
import { getSiteUrl } from "@/lib/site-url";
import { Breadcrumb } from "@/components/breadcrumb";
import { MediaGallery } from "@/components/media-gallery";
import { RatingStars } from "@/components/rating-stars";
import { ProductCard } from "@/components/product-card";
import { AddProductToCartButton } from "@/components/add-to-cart-button";
import { PaymentBadges } from "@/components/payment-badges";
import { KlarnaInstallments } from "@/components/klarna-installments";
import { WishlistToggleButton } from "@/components/wishlist-toggle-button";
import { ShareButton } from "@/components/share-button";
import { NotifyMeForm } from "./notify-me-form";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { prisma } from "@/lib/db";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string; locale: string }>;
}): Promise<Metadata> {
  const { id, locale } = await params;
  const product = await getProductById(id, { publishedOnly: true });
  if (!product) return {};

  const name = locale === "en" ? product.nameEn : product.nameFr;
  const description = locale === "en" ? product.descriptionEn : product.descriptionFr;
  const imageUrl = product.imageUrl || getProductImageUrl(product.category);
  const url = `${getSiteUrl()}/${locale}/boutique/${product.id}`;

  return {
    title: `${name} | Reptiles Concept`,
    description: description?.slice(0, 160),
    alternates: { canonical: url },
    openGraph: {
      title: name,
      description: description?.slice(0, 160),
      url,
      images: [{ url: imageUrl }],
      type: "website",
    },
  };
}

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const product = await getProductById(id, { publishedOnly: true });
  if (!product) notFound();

  const locale = await getLocale();
  const t = await getTranslations("Boutique");
  const tCategories = await getTranslations("NavCategories");
  const name = locale === "en" ? product.nameEn : product.nameFr;
  const description = locale === "en" ? product.descriptionEn : product.descriptionFr;
  const galleryImages =
    product.media.length > 0
      ? product.media.map((m) => m.url)
      : [product.imageUrl || getProductImageUrl(product.category)];

  const [customer, ratings, relatedProducts] = await Promise.all([
    getCurrentCustomer(),
    getProductRatings([product.id]),
    getRelatedProducts(product.category, product.id),
  ]);
  const rating = ratings.get(product.id);

  const isWishlisted = customer
    ? Boolean(
        await prisma.wishlistItem.findFirst({
          where: { customerId: customer.id, productId: product.id },
        }),
      )
    : false;

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name,
    description,
    image: galleryImages,
    sku: product.sku,
    offers: {
      "@type": "Offer",
      priceCurrency: "CAD",
      price: Number(product.priceCAD),
      availability:
        product.stockQty > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
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
          { label: t("title"), href: "/boutique" },
          { label: tCategories(product.category), href: `/boutique?category=${product.category}` },
          { label: name },
        ]}
      />

      <div className="grid gap-8 md:grid-cols-2">
        <MediaGallery images={galleryImages} alt={name} />

        <div className="flex flex-col gap-4">
          <div>
            <p className="text-sm font-medium uppercase tracking-wide text-accent">
              {product.category.replace(/_/g, " ")}
            </p>
            <h1 className="text-3xl font-bold tracking-tight">{name}</h1>
          </div>

          {rating ? <RatingStars rating={rating.average} count={rating.count} /> : null}

          <div>
            <p className="text-2xl font-bold text-primary">{Number(product.priceCAD)} $ CAD</p>
            <KlarnaInstallments priceCAD={Number(product.priceCAD)} className="mt-1" />
          </div>

          <p className="text-sm font-medium text-muted">
            {product.stockQty > 0 ? t("inStock") : t("outOfStock")}
          </p>

          {description ? (
            <p className="whitespace-pre-line leading-relaxed text-muted">{description}</p>
          ) : null}

          {product.stockQty > 0 ? (
            <AddProductToCartButton
              id={product.id}
              name={name}
              priceCAD={Number(product.priceCAD)}
              stockQty={product.stockQty}
            />
          ) : (
            <NotifyMeForm productId={product.id} />
          )}

          <PaymentBadges />
          <div className="flex items-center gap-3">
            <WishlistToggleButton type="product" itemId={product.id} initialActive={isWishlisted} />
            <ShareButton title={name} url={`${getSiteUrl()}/${locale}/boutique/${product.id}`} />
          </div>
        </div>
      </div>

      {relatedProducts.length > 0 ? (
        <section className="flex flex-col gap-4 border-t border-border pt-8">
          <h2 className="text-xl font-semibold text-foreground">{t("relatedTitle")}</h2>
          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {relatedProducts.map((related) => (
              <ProductCard
                key={related.id}
                product={related}
                locale={locale}
                inStockLabel={t("inStock")}
                outOfStockLabel={t("outOfStock")}
                backInStockLabel={t("backInStock")}
              />
            ))}
          </div>
        </section>
      ) : null}
    </main>
  );
}
