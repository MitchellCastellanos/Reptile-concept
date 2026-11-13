import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { AnimalCard } from "@/components/animal-card";
import { ProductCard } from "@/components/product-card";
import { CategoryButtonGrid } from "@/components/category-button-grid";
import { getAvailableAnimals, getProducts, getWishlistedIds } from "@/lib/queries";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { getAnimalRatings, getProductRatings } from "@/lib/ratings";
import { getActiveWelcomePromo } from "@/lib/promo";
import { LaunchHero } from "@/components/launch-hero";
import { ClassicHero } from "@/components/home-hero-classic";
import { HOME_HERO_VARIANT } from "@/lib/home-hero";

const categoryIcons = [
  { key: "animals" as const, href: "/animals", image: "/images/icons/category-reptiles.png" },
  { key: "terrariums" as const, href: "/boutique?category=terrarium", image: "/images/icons/category-terrariums.png" },
  { key: "substrates" as const, href: "/boutique?category=substrate", image: "/images/icons/category-substrates.png" },
  { key: "decor" as const, href: "/boutique?category=decor", image: "/images/icons/category-decor.png" },
  { key: "live_plants" as const, href: "/boutique?category=live_plants", image: "/images/icons/category-live-plants.png" },
  { key: "lighting" as const, href: "/boutique?category=lighting", image: "/images/icons/category-lighting.png" },
  { key: "equipment" as const, href: "/boutique?category=equipment", image: "/images/icons/category-equipment.png" },
  { key: "food" as const, href: "/boutique?category=food", image: "/images/icons/category-food.png" },
  { key: "supplement" as const, href: "/boutique?category=supplement", image: "/images/icons/category-supplement.png" },
];

const whyUsItems = [
  { key: "breeding" as const, image: "/images/icons/why-breeding.png" },
  { key: "advice" as const, image: "/images/icons/why-advice.png" },
  { key: "shipping" as const, image: "/images/icons/why-shipping.png" },
];

export default async function Home() {
  const t = await getTranslations("Home");
  const locale = await getLocale();
  const { items: animals } = await getAvailableAnimals(undefined, undefined, { page: 1, pageSize: 6 });
  const { items: products } = await getProducts(undefined, { publishedOnly: true, stock: "in_stock", pagination: { page: 1, pageSize: 4 } });
  const featured = animals.slice(0, 6);
  const popular = products.slice(0, 4);
  const customer = await getCurrentCustomer();
  const promo = await getActiveWelcomePromo();
  const validUntil = promo?.lastValidDay
    ? promo.lastValidDay.toLocaleDateString(locale === "en" ? "en-CA" : "fr-CA", {
        day: "numeric",
        month: "long",
        year: "numeric",
        timeZone: "America/Montreal",
      })
    : null;
  const { animalIds, productIds } = await getWishlistedIds(customer?.id);
  const [animalRatings, productRatings] = await Promise.all([
    getAnimalRatings(featured.map((a) => a.id)),
    getProductRatings(popular.map((p) => p.id)),
  ]);

  return (
    <>
      {promo && HOME_HERO_VARIANT === "launch" ? (
        <LaunchHero percentOff={promo.percentOff} code={promo.code} validUntil={validUntil} />
      ) : (
        <ClassicHero />
      )}

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-16 px-6 py-16">
        <section>
          <h2 className="text-center text-2xl font-semibold text-foreground">{t("categories")}</h2>
          <div className="mt-8">
            <CategoryButtonGrid
              items={categoryIcons.map(({ key, href, image }) => ({
                key,
                href,
                image,
                label: t(`category_${key}`),
              }))}
            />
          </div>
        </section>

        <section className="flex flex-col gap-6">
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-semibold">{t("availableAnimals")}</h2>
            <Link href="/animals" className="text-sm font-medium text-primary hover:underline">
              {t("viewAllAnimals")}
            </Link>
          </div>

          {featured.length === 0 ? (
            <p className="text-muted">{t("noAnimals")}</p>
          ) : (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {featured.map((animal) => (
                <AnimalCard
                  key={animal.id}
                  animal={animal}
                  locale={locale}
                  priceLabel={t("priceLabel")}
                  availableLabel={t("available")}
                  showWishlist
                  inWishlist={animalIds.has(animal.id)}
                  isLoggedIn={Boolean(customer)}
                  rating={animalRatings.get(animal.id)}
                />
              ))}
            </div>
          )}
        </section>

        {popular.length > 0 ? (
          <section className="flex flex-col gap-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-semibold">{t("popularProducts")}</h2>
              <Link href="/boutique" className="text-sm font-medium text-primary hover:underline">
                {t("viewAllProducts")}
              </Link>
            </div>
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {popular.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  locale={locale}
                  inStockLabel={t("inStock")}
                  outOfStockLabel={t("outOfStock")}
                  backInStockLabel={t("backInStock")}
                  showWishlist
                  inWishlist={productIds.has(product.id)}
                  isLoggedIn={Boolean(customer)}
                  rating={productRatings.get(product.id)}
                />
              ))}
            </div>
          </section>
        ) : null}

        <section className="rounded-3xl bg-accent-light px-8 py-12">
          <h2 className="text-center text-2xl font-semibold">{t("whyUs")}</h2>
          <div className="mt-10 grid grid-cols-1 gap-8 sm:grid-cols-3">
            {whyUsItems.map(({ key, image }) => (
              <div key={key} className="flex flex-col items-center gap-3 text-center">
                <span className="relative h-16 w-16 overflow-hidden rounded-full">
                  <Image src={image} alt="" fill className="object-cover" />
                </span>
                <h3 className="font-semibold">{t(`why_${key}_title`)}</h3>
                <p className="text-sm text-muted">{t(`why_${key}_body`)}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="flex flex-col items-center gap-4 rounded-3xl bg-primary px-8 py-12 text-center text-white">
          <h2 className="text-2xl font-semibold">{t("ctaTitle")}</h2>
          <p className="max-w-md text-white/80">{t("ctaBody")}</p>
          <Link
            href="/animals"
            className="mt-2 rounded-full bg-white px-6 py-3 text-sm font-semibold text-primary transition hover:bg-accent-light"
          >
            {t("ctaAnimals")}
          </Link>
        </section>
      </main>
    </>
  );
}
