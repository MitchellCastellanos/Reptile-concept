import { prisma } from "@/lib/db";
import { isProductCategory } from "@/lib/product-categories";
import { isAnimalCategory } from "@/lib/animal-categories";
import { isListingSort, isStockFilter, type ListingSort, type StockFilter } from "@/lib/listing";

export { PRODUCT_CATEGORIES, isProductCategory, type ProductCategoryValue } from "@/lib/product-categories";
export { ANIMAL_CATEGORIES, isAnimalCategory, type AnimalCategoryValue } from "@/lib/animal-categories";

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
) {
  const where = {
    status: "available" as const,
    ...(isAnimalCategory(category) ? { species: { category } } : {}),
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
  },
) {
  const stock: StockFilter = isStockFilter(opts?.stock) ? opts.stock : "all";
  const where = {
    ...(opts?.publishedOnly ? { published: true } : {}),
    ...(isProductCategory(category) ? { category } : {}),
    ...(stock === "in_stock" ? { stockQty: { gt: 0 } } : {}),
    ...(stock === "out_of_stock" ? { stockQty: { lte: 0 } } : {}),
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

export function getProductById(id: string, opts?: { publishedOnly?: boolean }) {
  return prisma.product.findFirst({
    where: {
      id,
      ...(opts?.publishedOnly ? { published: true } : {}),
    },
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
