import Image from "next/image";
import { getLocale, getTranslations } from "next-intl/server";
import { Link } from "@/i18n/navigation";
import { AnimalCard } from "@/components/animal-card";
import { ProductCard } from "@/components/product-card";
import { PaymentBadges } from "@/components/payment-badges";
import { getAvailableAnimals, getProducts } from "@/lib/queries";

const categoryIcons = [
  { key: "reptiles" as const, href: "/animals", image: "/images/icons/category-reptiles.png" },
  { key: "terrariums" as const, href: "/boutique", image: "/images/icons/category-terrariums.png" },
  { key: "substrates" as const, href: "/boutique", image: "/images/icons/category-substrates.png" },
  { key: "food" as const, href: "/boutique", image: "/images/icons/category-food.png" },
];

const whyUsItems = [
  { key: "breeding" as const, image: "/images/icons/why-breeding.png" },
  { key: "advice" as const, image: "/images/icons/why-advice.png" },
  { key: "shipping" as const, image: "/images/icons/why-shipping.png" },
];

export default async function Home() {
  const t = await getTranslations("Home");
  const locale = await getLocale();
  const animals = await getAvailableAnimals();
  const products = await getProducts();
  const featured = animals.slice(0, 6);
  const popular = products.slice(0, 4);

  return (
    <>
      <section className="relative flex min-h-[420px] items-center overflow-hidden">
        <Image
          src="/images/hero.jpg"
          alt="Reptile Concept"
          fill
          priority
          className="object-cover"
          sizes="100vw"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-primary/90 via-primary/70 to-primary/30" />
        <div className="relative mx-auto w-full max-w-6xl px-6 py-20">
          <p className="mb-2 text-sm font-medium uppercase tracking-widest text-white/80">
            Lachine, Québec
          </p>
          <h1 className="max-w-xl text-4xl font-bold tracking-tight text-white sm:text-5xl">
            {t("title")}
          </h1>
          <p className="mt-4 max-w-lg text-lg text-white/90">{t("tagline")}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/animals"
              className="rounded-full bg-white px-6 py-3 text-sm font-semibold text-primary transition hover:bg-accent-light"
            >
              {t("ctaAnimals")}
            </Link>
            <Link
              href="/boutique"
              className="rounded-full border-2 border-white px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10"
            >
              {t("ctaShop")}
            </Link>
          </div>
          <PaymentBadges variant="onDark" className="mt-8" />
        </div>
      </section>

      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-16 px-6 py-16">
        <section>
          <h2 className="text-center text-2xl font-semibold text-foreground">{t("categories")}</h2>
          <div className="mt-8 grid grid-cols-2 gap-4 sm:grid-cols-4">
            {categoryIcons.map(({ key, href, image }) => (
              <Link
                key={key}
                href={href}
                className="flex flex-col items-center gap-3 rounded-2xl border border-border bg-card p-6 text-center shadow-sm transition hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
              >
                <span className="relative h-16 w-16 overflow-hidden rounded-xl">
                  <Image src={image} alt="" fill className="object-cover" />
                </span>
                <span className="text-sm font-semibold text-foreground">{t(`category_${key}`)}</span>
              </Link>
            ))}
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
