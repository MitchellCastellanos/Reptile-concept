import { prisma } from "@/lib/db";

export function getAvailableAnimals() {
  return prisma.animal.findMany({
    where: { status: "available" },
    include: { species: true, media: { orderBy: { sortOrder: "asc" } } },
    orderBy: { createdAt: "desc" },
  });
}

export function getAnimalById(id: string) {
  return prisma.animal.findUnique({
    where: { id },
    include: { species: true, media: { orderBy: { sortOrder: "asc" } } },
  });
}

export function getProducts() {
  return prisma.product.findMany({ orderBy: { createdAt: "desc" } });
}

export function getProductById(id: string) {
  return prisma.product.findUnique({ where: { id } });
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
