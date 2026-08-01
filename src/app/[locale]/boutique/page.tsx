import { getLocale, getTranslations } from "next-intl/server";
import { getProducts, getWishlistedIds, isProductCategory, PRODUCT_CATEGORIES } from "@/lib/queries";
import { parsePageNumber, parsePageSize } from "@/lib/listing";
import { ProductCard } from "@/components/product-card";
import { Breadcrumb } from "@/components/breadcrumb";
import { CategoryPillNav } from "@/components/category-pill-nav";
import { ListingToolbar } from "@/components/listing-toolbar";
import { Pagination } from "@/components/pagination";
import { getCurrentCustomer } from "@/lib/customer-auth";

export default async function BoutiquePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; sort?: string; stock?: string; page?: string; perPage?: string }>;
}) {
  const { category, sort, stock, page: pageParam, perPage: perPageParam } = await searchParams;
  const t = await getTranslations("Boutique");
  const tListing = await getTranslations("Listing");
  const tCategories = await getTranslations("NavCategories");
  const locale = await getLocale();
  const page = parsePageNumber(pageParam);
  const pageSize = parsePageSize(perPageParam);
  const { items: products, total } = await getProducts(category, {
    publishedOnly: true,
    sort,
    stock,
    pagination: { page, pageSize },
  });
  const totalPages = Math.ceil(total / pageSize);
  const customer = await getCurrentCustomer();
  const { productIds } = await getWishlistedIds(customer?.id);

  const activeCategory = isProductCategory(category) ? category : undefined;

  function buildPageHref(targetPage: number) {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (sort) params.set("sort", sort);
    if (stock) params.set("stock", stock);
    if (perPageParam) params.set("perPage", perPageParam);
    if (targetPage > 1) params.set("page", String(targetPage));
    const query = params.toString();
    return query ? `/boutique?${query}` : "/boutique";
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-12">
      <div className="flex flex-col gap-3">
        <Breadcrumb
          items={[
            { label: t("title"), href: activeCategory ? "/boutique" : undefined },
            ...(activeCategory ? [{ label: tCategories(activeCategory) }] : []),
          ]}
        />
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {activeCategory ? tCategories(activeCategory) : t("title")}
          </h1>
          <p className="mt-2 text-muted">{t("subtitle")}</p>
        </div>
      </div>

      <CategoryPillNav
        allLabel={tListing("allProducts")}
        activeValue={activeCategory}
        items={PRODUCT_CATEGORIES.map((value) => ({ value, label: tCategories(value) }))}
      />

      <ListingToolbar resultCount={total} showStockFilter />

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

      <Pagination
        currentPage={page}
        totalPages={totalPages}
        buildHref={buildPageHref}
        previousLabel={tListing("paginationPrevious")}
        nextLabel={tListing("paginationNext")}
      />
    </main>
  );
}
