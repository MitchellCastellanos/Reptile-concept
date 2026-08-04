import type { Prisma } from "@/generated/prisma/client";
import { prisma } from "@/lib/db";
import { animalCategoriesInGroup, isAnimalCategory, isAnimalCategoryGroup } from "@/lib/animal-categories";
import { isProductCategory } from "@/lib/product-categories";
import { isStockFilter, type StockFilter } from "@/lib/listing";

export const SEARCH_RESULT_LIMIT = 24;
export const LISTING_SUGGESTION_LIMIT = 8;
export const LISTING_SEARCH_MIN_CHARS = 3;

export function animalTextSearchWhere(q: string): Prisma.AnimalWhereInput {
  return {
    OR: [
      { morph: { contains: q, mode: "insensitive" } },
      { species: { commonNameFr: { contains: q, mode: "insensitive" } } },
      { species: { commonNameEn: { contains: q, mode: "insensitive" } } },
      { species: { scientificName: { contains: q, mode: "insensitive" } } },
    ],
  };
}

export function productTextSearchWhere(q: string): Prisma.ProductWhereInput {
  return {
    OR: [
      { nameFr: { contains: q, mode: "insensitive" } },
      { nameEn: { contains: q, mode: "insensitive" } },
      { descriptionFr: { contains: q, mode: "insensitive" } },
      { descriptionEn: { contains: q, mode: "insensitive" } },
    ],
  };
}

function animalCategoryWhere(category?: string): Prisma.AnimalWhereInput {
  if (isAnimalCategory(category)) return { species: { category } };
  if (isAnimalCategoryGroup(category)) {
    return { species: { category: { in: animalCategoriesInGroup(category) } } };
  }
  return {};
}

function productCategoryWhere(category?: string): Prisma.ProductWhereInput {
  return isProductCategory(category) ? { category } : {};
}

function productStockWhere(stock: StockFilter): Prisma.ProductWhereInput {
  if (stock === "in_stock") return { stockQty: { gt: 0 } };
  if (stock === "out_of_stock") return { stockQty: { lte: 0 } };
  return {};
}

export async function searchCatalog(query: string) {
  const q = query.trim();
  if (!q) return { animals: [], products: [] };

  const [animals, products] = await Promise.all([
    prisma.animal.findMany({
      where: { status: "available", ...animalTextSearchWhere(q) },
      include: { species: true, media: { orderBy: { sortOrder: "asc" } } },
      take: SEARCH_RESULT_LIMIT,
    }),
    prisma.product.findMany({
      where: { published: true, ...productTextSearchWhere(q) },
      take: SEARCH_RESULT_LIMIT,
    }),
  ]);

  return { animals, products };
}

export async function searchListingSuggestions(
  scope: "animals" | "products",
  query: string,
  opts?: { category?: string; stock?: string },
) {
  const q = query.trim();
  if (q.length < LISTING_SEARCH_MIN_CHARS) return [];

  if (scope === "animals") {
    const animals = await prisma.animal.findMany({
      where: {
        status: "available",
        ...animalCategoryWhere(opts?.category),
        ...animalTextSearchWhere(q),
      },
      include: { species: true, media: { orderBy: { sortOrder: "asc" } } },
      orderBy: { createdAt: "desc" },
      take: LISTING_SUGGESTION_LIMIT,
    });
    return animals.map((animal) => ({
      id: animal.id,
      labelFr: `${animal.species.commonNameFr} — ${animal.morph}`,
      labelEn: `${animal.species.commonNameEn} — ${animal.morph}`,
      href: `/animals/${animal.id}`,
      imageUrl: animal.media[0]?.url ?? null,
      category: animal.species.category,
    }));
  }

  const stock: StockFilter = isStockFilter(opts?.stock) ? opts.stock : "in_stock";
  const products = await prisma.product.findMany({
    where: {
      published: true,
      ...productCategoryWhere(opts?.category),
      ...productStockWhere(stock),
      ...productTextSearchWhere(q),
    },
    orderBy: { createdAt: "desc" },
    take: LISTING_SUGGESTION_LIMIT,
  });
  return products.map((product) => ({
    id: product.id,
    labelFr: product.nameFr,
    labelEn: product.nameEn,
    href: `/boutique/${product.id}`,
    imageUrl: product.imageUrl,
    category: product.category,
  }));
}
