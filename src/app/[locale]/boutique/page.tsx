import { getLocale, getTranslations } from "next-intl/server";
import { getProducts } from "@/lib/queries";
import { ProductCard } from "@/components/product-card";

export default async function BoutiquePage() {
  const t = await getTranslations("Boutique");
  const locale = await getLocale();
  const products = await getProducts();

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-8 px-6 py-12">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground">{t("title")}</h1>
        <p className="mt-2 text-muted">{t("subtitle")}</p>
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
            />
          ))}
        </div>
      )}
    </main>
  );
}
