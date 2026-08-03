/**
 * Re-link Animal.speciesId from placeholder to real Species by name inference.
 *
 * Run after inventory:import-species-batch
 * Run: npm run inventory:link-animals-species
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config();

import { prisma } from "../src/lib/db";
import {
  inferSpeciesCandidate,
  normalizeScientificNameKey,
} from "../src/lib/species-candidates";
import { isCloverPlaceholderSpeciesId } from "../src/lib/admin-catalog-counts";

async function main() {
  const [animals, species] = await Promise.all([
    prisma.animal.findMany({
      select: { id: true, morph: true, speciesId: true, cloverItemId: true },
    }),
    prisma.species.findMany({
      select: { id: true, scientificName: true },
    }),
  ]);

  const createdMeta = await prisma.cloverImportCandidate.findMany({
    where: { status: "created" },
    select: { cloverItemId: true, cloverCategoryName: true },
  });
  const cloverCatById = new Map(createdMeta.map((c) => [c.cloverItemId, c.cloverCategoryName ?? ""]));

  const speciesByKey = new Map(
    species
      .filter((s) => !isCloverPlaceholderSpeciesId(s.id))
      .map((s) => [normalizeScientificNameKey(s.scientificName), s.id]),
  );

  let linked = 0;
  let unchanged = 0;
  let unmatched = 0;

  for (const animal of animals) {
    if (!isCloverPlaceholderSpeciesId(animal.speciesId)) {
      unchanged++;
      continue;
    }

    const cloverCategory = animal.cloverItemId ? cloverCatById.get(animal.cloverItemId) : null;
    const inferred = inferSpeciesCandidate(animal.morph, cloverCategory);
    if (!inferred) {
      unmatched++;
      continue;
    }

    const targetId = speciesByKey.get(normalizeScientificNameKey(inferred.scientificName));
    if (!targetId) {
      unmatched++;
      continue;
    }

    await prisma.animal.update({
      where: { id: animal.id },
      data: { speciesId: targetId },
    });
    linked++;
  }

  console.log(`Link animals → species:`);
  console.log(`  linked: ${linked}`);
  console.log(`  already real species: ${unchanged}`);
  console.log(`  still placeholder (no match): ${unmatched}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
