import { getLocale, getTranslations } from "next-intl/server";
import {
  FOOD_CATEGORIES,
  getProducts,
  getFeaturedOutOfStockProducts,
  getWishlistedIds,
  isFoodCategory,
  isProductCategory,
  isProductCategoryGroup,
  PRODUCT_BROWSE_CATEGORIES,
} from "@/lib/queries";
import { isStockFilter, parsePageNumber, parsePageSize } from "@/lib/listing";
import { getProductRatings } from "@/lib/ratings";
import { ProductCard } from "@/components/product-card";
import { Breadcrumb } from "@/components/breadcrumb";
import { ProductCategoryNav } from "@/components/product-category-nav";
import { ListingScrollAnchor } from "@/components/listing-scroll-anchor";
import { ListingSearch } from "@/components/listing-search";
import { ListingToolbar } from "@/components/listing-toolbar";
import { Pagination } from "@/components/pagination";
import { getCurrentCustomer } from "@/lib/customer-auth";

export default async function BoutiquePage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string; sort?: string; stock?: string; page?: string; perPage?: string; q?: string }>;
}) {
  const { category, sort, stock, page: pageParam, perPage: perPageParam, q } = await searchParams;
  const t = await getTranslations("Boutique");
  const tListing = await getTranslations("Listing");
  const tCategories = await getTranslations("NavCategories");
  const locale = await getLocale();
  const activeCategory = isProductCategory(category) ? category : undefined;
  const activeGroup = isProductCategoryGroup(category) ? category : isFoodCategory(activeCategory) ? "food" : undefined;
  const activeTop = activeGroup ?? activeCategory;
  const stockFilter = isStockFilter(stock) ? stock : "in_stock";
  const showFeaturedOos = stockFilter === "in_stock" && stock === undefined && !q?.trim();
  const page = parsePageNumber(pageParam);
  const pageSize = parsePageSize(perPageParam);

  const [{ items: products, total }, featuredOos] = await Promise.all([
    getProducts(category, {
      publishedOnly: true,
      sort,
      stock: stockFilter,
      pagination: { page, pageSize },
      q,
    }),
    showFeaturedOos ? getFeaturedOutOfStockProducts(category) : Promise.resolve([]),
  ]);
  const inStockIds = new Set(products.map((p) => p.id));
  const featuredOnly = featuredOos.filter((p) => !inStockIds.has(p.id));
  const totalPages = Math.ceil(total / pageSize);
  const customer = await getCurrentCustomer();
  const { productIds } = await getWishlistedIds(customer?.id);
  const ratings = await getProductRatings([...products.map((p) => p.id), ...featuredOnly.map((p) => p.id)]);

  function buildPageHref(targetPage: number) {
    const params = new URLSearchParams();
    if (category) params.set("category", category);
    if (sort) params.set("sort", sort);
    if (stock && stock !== "in_stock") params.set("stock", stock);
    if (perPageParam) params.set("perPage", perPageParam);
    if (q) params.set("q", q);
    if (targetPage > 1) params.set("page", String(targetPage));
    const query = params.toString();
    return query ? `/boutique?${query}` : "/boutique";
  }

  return (
    <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-6 py-12">
      <div className="flex flex-col gap-3">
        <Breadcrumb
          items={[
            { label: t("title"), href: activeTop ? "/boutique" : undefined },
            ...(activeGroup
              ? [{ label: tCategories(activeGroup), href: activeCategory ? `/boutique?category=${activeGroup}` : undefined }]
              : []),
            ...(activeCategory ? [{ label: tCategories(activeCategory) }] : []),
          ]}
        />
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">
            {activeCategory ? tCategories(activeCategory) : activeGroup ? tCategories(activeGroup) : t("title")}
          </h1>
          <p className="mt-2 text-muted">{t("subtitle")}</p>
        </div>
      </div>

      <ProductCategoryNav
        allLabel={tListing("allProducts")}
        activeTopValue={activeTop}
        activeValue={category}
        items={PRODUCT_BROWSE_CATEGORIES.map(({ value, image }) => ({ value, image, label: tCategories(value) }))}
        subItems={activeGroup ? FOOD_CATEGORIES.map((value) => ({ value, label: tCategories(value) })) : undefined}
        subAllLabel={tListing("allFood")}
      />

      <ListingSearch scope="products" category={category} stock={stockFilter} />

      <ListingToolbar resultCount={total + (showFeaturedOos ? featuredOnly.length : 0)} showStockFilter />

      <ListingScrollAnchor />

      {products.length === 0 && featuredOnly.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center">
          <p className="text-4xl">🏠</p>
          <p className="mt-4 text-muted">{t("noProducts")}</p>
        </div>
      ) : (
        <>
          {products.length > 0 ? (
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((product) => (
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
                  rating={ratings.get(product.id)}
                />
              ))}
            </div>
          ) : null}

          <Pagination
            currentPage={page}
            totalPages={totalPages}
            buildHref={buildPageHref}
            previousLabel={tListing("paginationPrevious")}
            nextLabel={tListing("paginationNext")}
          />

          {featuredOnly.length > 0 ? (
            <section className="mt-10 flex flex-col gap-4">
              <div>
                <h2 className="text-lg font-semibold text-foreground">{t("featuredOutOfStock")}</h2>
                <p className="text-sm text-muted">{t("featuredOutOfStockHint")}</p>
              </div>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
                {featuredOnly.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    locale={locale}
                    inStockLabel={t("inStock")}
                    outOfStockLabel={t("outOfStock")}
                    showWishlist
                    inWishlist={productIds.has(product.id)}
                    isLoggedIn={Boolean(customer)}
                    rating={ratings.get(product.id)}
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
