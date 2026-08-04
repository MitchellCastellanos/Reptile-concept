import { prisma } from "@/lib/db";
import { isProductCategory } from "@/lib/product-categories";
import { animalCategoriesInGroup, isAnimalCategory, isAnimalCategoryGroup } from "@/lib/animal-categories";
import { isListingSort, isStockFilter, type ListingSort, type StockFilter } from "@/lib/listing";
import { animalTextSearchWhere, productTextSearchWhere } from "@/lib/search";

export { PRODUCT_CATEGORIES, isProductCategory, type ProductCategoryValue } from "@/lib/product-categories";
export { ANIMAL_CATEGORIES, ANIMAL_CATEGORY_GROUPS, ANIMAL_CATEGORY_ICON, animalCategoryGroup, isAnimalCategory, isAnimalCategoryGroup, type AnimalCategoryValue } from "@/lib/animal-categories";

/** Max out-of-stock items shown below the in-stock grid on /boutique. */
export const FEATURED_OUT_OF_STOCK_LIMIT = 6;

function orderByForSort(sort: string | undefined) {
  const value: ListingSort = isListingSort(sort) ? sort : "newest";
  if (value === "price_asc") return { priceCAD: "asc" as const };
  if (value === "price_desc") return { priceCAD: "desc" as const };
  return { createdAt: "desc" as const };
}

export async function getAvailableAnimals(
  category?: string,
  sort?: string,
  pagination?: { page: number; pageSize: number },
  q?: string,
) {
  const search = q?.trim();
  const where = {
    status: "available" as const,
    ...(isAnimalCategory(category)
      ? { species: { category } }
      : isAnimalCategoryGroup(category)
        ? { species: { category: { in: animalCategoriesInGroup(category) } } }
        : {}),
    ...(search ? animalTextSearchWhere(search) : {}),
  };
  const [items, total] = await Promise.all([
    prisma.animal.findMany({
      where,
      include: { species: true, media: { orderBy: { sortOrder: "asc" } } },
      orderBy: orderByForSort(sort),
      ...(pagination
        ? { skip: (pagination.page - 1) * pagination.pageSize, take: pagination.pageSize }
        : {}),
    }),
    prisma.animal.count({ where }),
  ]);
  return { items, total };
}

export function getAnimalById(id: string) {
  return prisma.animal.findUnique({
    where: { id },
    include: { species: true, media: { orderBy: { sortOrder: "asc" } } },
  });
}

export async function getProducts(
  category?: string,
  opts?: {
    publishedOnly?: boolean;
    sort?: string;
    stock?: string;
    pagination?: { page: number; pageSize: number };
    q?: string;
  },
) {
  const stock: StockFilter = isStockFilter(opts?.stock) ? opts.stock : "in_stock";
  const search = opts?.q?.trim();
  const where = {
    ...(opts?.publishedOnly ? { published: true } : {}),
    ...(isProductCategory(category) ? { category } : {}),
    ...(stock === "in_stock" ? { stockQty: { gt: 0 } } : {}),
    ...(stock === "out_of_stock" ? { stockQty: { lte: 0 } } : {}),
    ...(search ? productTextSearchWhere(search) : {}),
  };
  const [items, total] = await Promise.all([
    prisma.product.findMany({
      where,
      orderBy: orderByForSort(opts?.sort),
      ...(opts?.pagination
        ? { skip: (opts.pagination.page - 1) * opts.pagination.pageSize, take: opts.pagination.pageSize }
        : {}),
    }),
    prisma.product.count({ where }),
  ]);
  return { items, total };
}

/** A handful of recently-updated OOS products — shown under the in-stock grid only. */
export function getFeaturedOutOfStockProducts(category?: string, limit = FEATURED_OUT_OF_STOCK_LIMIT) {
  return prisma.product.findMany({
    where: {
      published: true,
      stockQty: { lte: 0 },
      ...(isProductCategory(category) ? { category } : {}),
    },
    orderBy: { updatedAt: "desc" },
    take: limit,
  });
}

export function getProductById(id: string, opts?: { publishedOnly?: boolean }) {
  return prisma.product.findFirst({
    where: {
      id,
      ...(opts?.publishedOnly ? { published: true } : {}),
    },
    include: { media: { orderBy: { sortOrder: "asc" } } },
  });
}

/** Other available animals of the same species category, for the detail page's "related" section. */
export function getRelatedAnimals(category: string, excludeId: string, limit = 4) {
  return prisma.animal.findMany({
    where: {
      status: "available",
      id: { not: excludeId },
      ...(isAnimalCategory(category) ? { species: { category } } : {}),
    },
    include: { species: true, media: { orderBy: { sortOrder: "asc" } } },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

/** Other published, in-stock products of the same category, for the detail page's "related" section. */
export function getRelatedProducts(category: string, excludeId: string, limit = 4) {
  return prisma.product.findMany({
    where: {
      published: true,
      stockQty: { gt: 0 },
      id: { not: excludeId },
      ...(isProductCategory(category) ? { category } : {}),
    },
    orderBy: { createdAt: "desc" },
    take: limit,
  });
}

export async function getWishlistedIds(customerId: string | undefined) {
  if (!customerId) return { animalIds: new Set<string>(), productIds: new Set<string>() };
  const items = await prisma.wishlistItem.findMany({
    where: { customerId },
    select: { animalId: true, productId: true },
  });
  return {
    animalIds: new Set(items.map((i) => i.animalId).filter((id): id is string => id !== null)),
    productIds: new Set(items.map((i) => i.productId).filter((id): id is string => id !== null)),
  };
}

export function getActiveAnnouncement() {
  const now = new Date();
  return prisma.announcement.findFirst({
    where: {
      active: true,
      startsAt: { lte: now },
      OR: [{ endsAt: null }, { endsAt: { gte: now } }],
    },
    orderBy: { startsAt: "desc" },
  });
}
