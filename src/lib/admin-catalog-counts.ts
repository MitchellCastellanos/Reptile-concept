import { prisma } from "@/lib/db";
import { isCareSheetIncomplete } from "@/lib/species-utils";

export const CLOVER_PLACEHOLDER_SPECIES_PREFIX = "clover-species-";

export function isCloverPlaceholderSpeciesId(speciesId: string) {
  return speciesId.startsWith(CLOVER_PLACEHOLDER_SPECIES_PREFIX);
}

export async function getAdminCatalogCounts() {
  const [animals, species] = await Promise.all([
    prisma.animal.findMany({
      select: {
        speciesId: true,
        species: {
          select: { id: true, descriptionEn: true, humidity: true, adultSizeEn: true },
        },
      },
    }),
    prisma.species.findMany({
      select: { id: true, descriptionEn: true, humidity: true, adultSizeEn: true },
    }),
  ]);

  const animalsNeedingAttention = animals.filter(
    (a) => isCloverPlaceholderSpeciesId(a.speciesId) || isCareSheetIncomplete(a.species),
  ).length;

  const speciesIncomplete = species.filter(
    (s) => !isCloverPlaceholderSpeciesId(s.id) && isCareSheetIncomplete(s),
  ).length;

  const productsUnpublishedInStock = await prisma.product.count({
    where: { published: false, stockQty: { gt: 0 } },
  });

  return { animalsNeedingAttention, speciesIncomplete, productsUnpublishedInStock };
}
