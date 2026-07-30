import { getLocale, getTranslations } from "next-intl/server";
import { getProducts, getWishlistedIds, isProductCategory } from "@/lib/queries";
import { ProductCard } from "@/components/product-card";
import { getCurrentCustomer } from "@/lib/customer-auth";
import { Link } from "@/i18n/navigation";

export default async function BoutiquePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const t = await getTranslations("Boutique");
  const tCategories = await getTranslations("NavCategories");
  const locale = await getLocale();
  const products = await getProducts(category);
  const customer = await getCurrentCustomer();
  const { productIds } = await getWishlistedIds(customer?.id);

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{t("title")}</h1>
        <p className="mt-2 text-muted">{t("subtitle")}</p>
        {isProductCategory(category) ? (
          <Link
            href="/boutique"
            className="mt-4 inline-flex items-center gap-1.5 rounded-full bg-accent-light px-3 py-1.5 text-sm font-medium text-accent hover:bg-accent/20"
          >
            {tCategories(category)}
            <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </Link>
        ) : null}
      </div>

      {products.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <p className="text-4xl">🏠</p>
          <p className="mt-4 text-muted">{t("noProducts")}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {products.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              locale={locale}
              inStockLabel={t("inStock")}
              outOfStockLabel={t("outOfStock")}
              showWishlist
              inWishlist={productIds.has(product.id)}
            />
          ))}
        </div>
      )}
    </main>
  );
}
