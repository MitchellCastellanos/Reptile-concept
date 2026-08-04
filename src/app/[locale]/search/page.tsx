import { getLocale, getTranslations } from "next-intl/server";
import { searchCatalog } from "@/lib/search";
import { getAnimalRatings, getProductRatings } from "@/lib/ratings";
import { getWishlistedIds } from "@/lib/queries";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { AnimalCard } from "@/components/animal-card";
import { ProductCard } from "@/components/product-card";
import { SearchForm } from "./search-form";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const query = (q ?? "").trim();
  const locale = await getLocale();
  const t = await getTranslations("Search");
  const home = await getTranslations("Home");
  const tBoutique = await getTranslations("Boutique");

  const { animals, products } = await searchCatalog(query);
  const customer = await getCurrentCustomer();
  const [{ animalIds, productIds }, animalRatings, productRatings] = await Promise.all([
    getWishlistedIds(customer?.id),
    getAnimalRatings(animals.map((a) => a.id)),
    getProductRatings(products.map((p) => p.id)),
  ]);
  const totalResults = animals.length + products.length;

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-12">
      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{t("title")}</h1>
        <SearchForm initialQuery={query} />
      </div>

      {!query ? (
        <p className="text-muted">{t("prompt")}</p>
      ) : totalResults === 0 ? (
        <p className="text-muted">{t("noResults", { query })}</p>
      ) : (
        <>
          <p className="text-sm text-muted">{t("resultsFor", { query, count: totalResults })}</p>

          {animals.length > 0 ? (
            <section className="flex flex-col gap-4">
              <h2 className="text-xl font-semibold text-foreground">{t("animalsHeading")}</h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {animals.map((animal) => (
                  <AnimalCard
                    key={animal.id}
                    animal={animal}
                    locale={locale}
                    priceLabel={home("priceLabel")}
                    availableLabel={home("available")}
                    showWishlist
                    inWishlist={animalIds.has(animal.id)}
                    isLoggedIn={Boolean(customer)}
                    rating={animalRatings.get(animal.id)}
                  />
                ))}
              </div>
            </section>
          ) : null}

          {products.length > 0 ? (
            <section className="flex flex-col gap-4">
              <h2 className="text-xl font-semibold text-foreground">{t("productsHeading")}</h2>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {products.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    locale={locale}
                    inStockLabel={tBoutique("inStock")}
                    outOfStockLabel={tBoutique("outOfStock")}
                    backInStockLabel={tBoutique("backInStock")}
                    showWishlist
                    inWishlist={productIds.has(product.id)}
                    isLoggedIn={Boolean(customer)}
                    rating={productRatings.get(product.id)}
                  />
                ))}
              </div>
            </section>
          ) : null}
        </>
      )}
    </main>
  );
}
