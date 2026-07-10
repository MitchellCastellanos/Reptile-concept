import { getLocale, getTranslations } from "next-intl/server";
import { getProducts } from "@/lib/queries";

export default async function BoutiquePage() {
  const t = await getTranslations("Boutique");
  const locale = await getLocale();
  const products = await getProducts();

  return (
    <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col gap-8 px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3">
        {products.map((product) => {
          const name = locale === "en" ? product.nameEn : product.nameFr;
          return (
            <div
              key={product.id}
              className="rounded-lg border border-black/10 p-4 dark:border-white/10"
            >
              <p className="text-xs uppercase tracking-wide text-zinc-500">
                {product.category}
              </p>
              <p className="mt-1 font-medium">{name}</p>
              <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                {Number(product.priceCAD)} $ CAD
              </p>
              <p className="mt-1 text-xs text-zinc-500">
                {product.stockQty > 0 ? t("inStock") : t("outOfStock")}
              </p>
            </div>
          );
        })}
      </div>
    </main>
  );
}
