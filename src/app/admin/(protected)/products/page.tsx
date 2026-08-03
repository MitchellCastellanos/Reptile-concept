import Image from "next/image";
import Link from "next/link";
import { prisma } from "@/lib/db";
import { isProductCategory, PRODUCT_CATEGORIES } from "@/lib/product-categories";
import { parseAdminListParams, searchWhere, type SortDir } from "@/lib/admin-catalog-listing";
import { productNeedsAttention } from "@/lib/admin-catalog-attention";
import { getProductImageUrl } from "@/lib/images";
import { AdminCatalogAlertBanner } from "@/components/admin/admin-catalog-alert-banner";
import {
  AdminAlertRowLink,
  AdminCatalogAlertSection,
} from "@/components/admin/admin-catalog-alert-section";
import { AdminCatalogFilters } from "@/components/admin/admin-catalog-filters";
import { AdminPagination } from "@/components/admin/admin-pagination";
import { AdminSortableTh } from "@/components/admin/admin-sortable-th";
import { deleteProductAction } from "./actions";

const BASE = "/admin/products";

const PRODUCT_ATTENTION_WHERE = {
  published: false,
  stockQty: { gt: 0 },
};

function productOrderBy(sort: string, dir: SortDir) {
  if (sort === "name") return { nameFr: dir };
  if (sort === "sku") return { sku: dir };
  if (sort === "category") return { category: dir };
  if (sort === "price") return { priceCAD: dir };
  if (sort === "stock") return { stockQty: dir };
  if (sort === "published") return { published: dir };
  if (sort === "createdAt") return { createdAt: dir };
  return { createdAt: "desc" as const };
}

function listParams(searchParams: Record<string, string | string[] | undefined>) {
  const base = parseAdminListParams(searchParams);
  const get = (key: string) => {
    const v = searchParams[key];
    return typeof v === "string" ? v : undefined;
  };
  return {
    ...base,
    category: get("category") || undefined,
    published: get("published") || undefined,
    stock: get("stock") || undefined,
    attention: get("attention") || undefined,
  };
}

export default async function AdminProductsPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const sp = await searchParams;
  const params = listParams(sp);
  const { q, page, perPage, sort, dir, category, published, stock, attention } = params;

  const where = {
    ...(isProductCategory(category) ? { category } : {}),
    ...(published === "yes" ? { published: true } : {}),
    ...(published === "no" ? { published: false } : {}),
    ...(stock === "in_stock" ? { stockQty: { gt: 0 } } : {}),
    ...(stock === "out_of_stock" ? { stockQty: { lte: 0 } } : {}),
    ...(attention === "yes" ? PRODUCT_ATTENTION_WHERE : {}),
    ...searchWhere(["sku", "nameFr", "nameEn"], q),
  };

  const listParamsForLinks = { q, category, published, stock, attention, perPage, sort, dir };

  const [alertCount, alertRows, total, products] = await Promise.all([
    prisma.product.count({ where: { ...where, ...PRODUCT_ATTENTION_WHERE } }),
    prisma.product.findMany({
      where: { ...where, ...PRODUCT_ATTENTION_WHERE },
      orderBy: productOrderBy(sort === "default" ? "createdAt" : sort, dir),
      take: 50,
    }),
    prisma.product.count({ where }),
    prisma.product.findMany({
      where,
      orderBy: productOrderBy(sort === "default" ? "createdAt" : sort, dir),
      skip: (page - 1) * perPage,
      take: perPage,
    }),
  ]);

  const totalPages = Math.max(1, Math.ceil(total / perPage));

  const categoryOptions = [
    { value: "", label: "Toutes" },
    ...PRODUCT_CATEGORIES.map((c) => ({ value: c, label: c })),
  ];

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">Produits</h1>
        <Link
          href="/admin/products/new"
          className="rounded bg-foreground px-4 py-2 text-sm font-medium text-background"
        >
          + Nouveau produit
        </Link>
      </div>

      <AdminCatalogAlertBanner kind="products" count={alertCount} />

      {alertCount > 0 && attention !== "yes" ? (
        <AdminCatalogAlertSection title={`Attention requise — ${alertCount} produit(s)`}>
          {alertRows.map((p) => (
            <AdminAlertRowLink
              key={p.id}
              href={`/admin/products/${p.id}/edit`}
              primary={p.nameFr}
              secondary={`SKU ${p.sku} · stock ${p.stockQty}`}
              badge="Non publié"
            />
          ))}
        </AdminCatalogAlertSection>
      ) : null}

      <AdminCatalogFilters
        basePath={BASE}
        params={listParamsForLinks}
        resultCount={total}
        fields={[
          { type: "search", name: "q", label: "Recherche", placeholder: "SKU ou nom…" },
          { type: "select", name: "category", label: "Catégorie", options: categoryOptions },
          {
            type: "select",
            name: "published",
            label: "Publié",
            options: [
              { value: "", label: "Tous" },
              { value: "yes", label: "Oui" },
              { value: "no", label: "Non" },
            ],
          },
          {
            type: "select",
            name: "stock",
            label: "Stock",
            options: [
              { value: "", label: "Tous" },
              { value: "in_stock", label: "En stock" },
              { value: "out_of_stock", label: "Rupture" },
            ],
          },
          {
            type: "select",
            name: "attention",
            label: "Alertes",
            options: [
              { value: "", label: "Tous" },
              { value: "yes", label: "Uniquement alertes" },
            ],
          },
        ]}
      />

      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-sm">
          <thead>
            <tr className="border-b border-black/10 text-left dark:border-white/10">
              <th className="py-2 pr-3">Photo</th>
              <AdminSortableTh label="SKU" sortKey="sku" currentSort={sort} currentDir={dir} basePath={BASE} params={listParamsForLinks} />
              <AdminSortableTh label="Nom" sortKey="name" currentSort={sort} currentDir={dir} basePath={BASE} params={listParamsForLinks} />
              <AdminSortableTh label="Catégorie" sortKey="category" currentSort={sort} currentDir={dir} basePath={BASE} params={listParamsForLinks} />
              <AdminSortableTh label="Prix" sortKey="price" currentSort={sort} currentDir={dir} basePath={BASE} params={listParamsForLinks} />
              <AdminSortableTh label="Stock" sortKey="stock" currentSort={sort} currentDir={dir} basePath={BASE} params={listParamsForLinks} />
              <AdminSortableTh label="Publié" sortKey="published" currentSort={sort} currentDir={dir} basePath={BASE} params={listParamsForLinks} />
              <AdminSortableTh label="Ajouté" sortKey="createdAt" currentSort={sort} currentDir={dir} basePath={BASE} params={listParamsForLinks} />
              <th className="py-2" />
            </tr>
          </thead>
          <tbody>
            {products.map((product) => {
              const alert = productNeedsAttention(product);
              return (
                <tr
                  key={product.id}
                  className={`border-b border-black/5 dark:border-white/5 ${alert ? "bg-amber-50/80 dark:bg-amber-950/15" : ""}`}
                >
                  <td className="py-2 pr-3">
                    <Image
                      src={product.imageUrl || getProductImageUrl(product.category)}
                      alt=""
                      width={48}
                      height={48}
                      className="h-12 w-12 rounded object-cover"
                    />
                  </td>
                  <td className="py-2 pr-3 font-mono text-xs">{product.sku}</td>
                  <td className="py-2 pr-3">{product.nameFr}</td>
                  <td className="py-2 pr-3">{product.category}</td>
                  <td className="py-2 pr-3">{Number(product.priceCAD)} $</td>
                  <td className="py-2 pr-3">{product.stockQty}</td>
                  <td className="py-2 pr-3">
                    {product.published ? (
                      <span className="text-green-700 dark:text-green-500">Oui</span>
                    ) : (
                      <span className="text-amber-600 dark:text-amber-400">Non</span>
                    )}
                  </td>
                  <td className="py-2 pr-3 text-xs text-black/50">
                    {product.createdAt.toLocaleDateString("fr-CA")}
                  </td>
                  <td className="flex gap-3 py-2">
                    <Link href={`/admin/products/${product.id}/edit`} className="underline">
                      Modifier
                    </Link>
                    <form action={deleteProductAction}>
                      <input type="hidden" name="id" value={product.id} />
                      <button type="submit" className="text-red-600 underline dark:text-red-400">
                        Supprimer
                      </button>
                    </form>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <AdminPagination basePath={BASE} params={listParamsForLinks} currentPage={page} totalPages={totalPages} />
    </div>
  );
}
