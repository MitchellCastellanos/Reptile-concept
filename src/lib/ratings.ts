import { prisma } from "@/lib/db";

export type RatingSummary = { average: number; count: number };

async function ratingsFor(pick: "animalId" | "productId", ids: string[]): Promise<Map<string, RatingSummary>> {
  if (ids.length === 0) return new Map();

  const reviews = await prisma.review.findMany({
    where: {
      published: true,
      order: { items: { some: { [pick]: { in: ids } } } },
    },
    select: {
      rating: true,
      animalId: true,
      productId: true,
      order: { select: { items: { select: { animalId: true, productId: true } } } },
    },
  });

  const sums = new Map<string, { total: number; count: number }>();
  function add(id: string, rating: number) {
    const entry = sums.get(id) ?? { total: 0, count: 0 };
    entry.total += rating;
    entry.count += 1;
    sums.set(id, entry);
  }

  for (const review of reviews) {
    const isTagged = review.animalId !== null || review.productId !== null;

    if (isTagged) {
      // Customer flagged a specific item (see /reviews/new/[orderId]) — only
      // that exact item gets this rating, never diluted across siblings.
      const taggedId = pick === "animalId" ? review.animalId : review.productId;
      if (taggedId && ids.includes(taggedId)) add(taggedId, review.rating);
      continue;
    }

    // Untagged: applies to every item in the order (single-item orders are
    // the common case, so this is exact there — multi-item orders share it).
    const itemIds = new Set(
      review.order.items.map((item) => item[pick]).filter((id): id is string => id !== null && ids.includes(id)),
    );
    for (const id of itemIds) add(id, review.rating);
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
