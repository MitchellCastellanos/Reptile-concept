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
      itemRatings: { select: { animalId: true, productId: true, rating: true } },
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
    // Items the customer explicitly rated (see /reviews/new/[orderId]) get
    // that exact rating — never diluted by the overall score.
    const explicit = new Set<string>();
    for (const itemRating of review.itemRatings) {
      const id = pick === "animalId" ? itemRating.animalId : itemRating.productId;
      if (!id) continue;
      explicit.add(id);
      if (ids.includes(id)) add(id, itemRating.rating);
    }

    // Everything else in the order (the common case: no breakdown at all,
    // or items the customer didn't get to) falls back to the overall rating.
    const orderItemIds = review.order.items
      .map((item) => item[pick])
      .filter((id): id is string => id !== null && ids.includes(id) && !explicit.has(id));
    for (const id of new Set(orderItemIds)) add(id, review.rating);
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
