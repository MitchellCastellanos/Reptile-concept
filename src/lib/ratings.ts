import { prisma } from "@/lib/db";

export type RatingSummary = { average: number; count: number };

async function ratingsFor(pick: "animalId" | "productId", ids: string[]): Promise<Map<string, RatingSummary>> {
  if (ids.length === 0) return new Map();

  const reviews = await prisma.review.findMany({
    where: {
      published: true,
      order: { items: { some: { [pick]: { in: ids } } } },
    },
    select: { rating: true, order: { select: { items: { select: { animalId: true, productId: true } } } } },
  });

  const sums = new Map<string, { total: number; count: number }>();
  for (const review of reviews) {
    const itemIds = new Set(
      review.order.items
        .map((item) => item[pick])
        .filter((id): id is string => id !== null && ids.includes(id)),
    );
    for (const id of itemIds) {
      const entry = sums.get(id) ?? { total: 0, count: 0 };
      entry.total += review.rating;
      entry.count += 1;
      sums.set(id, entry);
    }
  }

  const result = new Map<string, RatingSummary>();
  for (const [id, { total, count }] of sums) {
    result.set(id, { average: total / count, count });
  }
  return result;
}

/** Average rating per animal, derived from published reviews on orders that included it. */
export function getAnimalRatings(ids: string[]) {
  return ratingsFor("animalId", ids);
}

/** Average rating per product, derived from published reviews on orders that included it. */
export function getProductRatings(ids: string[]) {
  return ratingsFor("productId", ids);
}
