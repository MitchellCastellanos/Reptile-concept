import { prisma } from "@/lib/db";

export const SEARCH_RESULT_LIMIT = 24;

export async function searchCatalog(query: string) {
  const q = query.trim();
  if (!q) return { animals: [], products: [] };

  const [animals, products] = await Promise.all([
    prisma.animal.findMany({
      where: {
        status: "available",
        OR: [
          { morph: { contains: q, mode: "insensitive" } },
          { species: { commonNameFr: { contains: q, mode: "insensitive" } } },
          { species: { commonNameEn: { contains: q, mode: "insensitive" } } },
          { species: { scientificName: { contains: q, mode: "insensitive" } } },
        ],
      },
      include: { species: true, media: { orderBy: { sortOrder: "asc" } } },
      take: SEARCH_RESULT_LIMIT,
    }),
    prisma.product.findMany({
      where: {
        published: true,
        OR: [
          { nameFr: { contains: q, mode: "insensitive" } },
          { nameEn: { contains: q, mode: "insensitive" } },
          { descriptionFr: { contains: q, mode: "insensitive" } },
          { descriptionEn: { contains: q, mode: "insensitive" } },
        ],
      },
      take: SEARCH_RESULT_LIMIT,
    }),
  ]);

  return { animals, products };
}
