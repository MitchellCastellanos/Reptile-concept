/**
 * Reassign auto-imported animals to finer browse subcategories (geckos,
 * arachnids, frogs, etc.) based on listing title / morph keywords.
 *
 *   npm run inventory:reclassify-animals
 *   npm run inventory:reclassify-animals -- --apply
 */
import "dotenv/config";
import { prisma } from "../src/lib/db";
import {
  CLOVER_SPECIES_ID_BY_CATEGORY,
  type AnimalCategoryValue,
} from "../src/lib/animal-categories";
import { inferAnimalCategoryFromMorph } from "../src/lib/animal-category-inference";

const apply = process.argv.includes("--apply");

const PLACEHOLDER_PREFIX = "clover-species-";

const SPECIES_UPSERTS: Record<
  string,
  { commonNameFr: string; commonNameEn: string; scientificName: string; category: AnimalCategoryValue }
> = {
  "clover-species-serpent": { commonNameFr: "Serpent", commonNameEn: "Snake", scientificName: "Serpentes sp.", category: "reptiles_snakes" },
  "clover-species-gecko": { commonNameFr: "Gecko", commonNameEn: "Gecko", scientificName: "Gekkota sp.", category: "reptiles_geckos" },
  "clover-species-lezard": { commonNameFr: "Lézard", commonNameEn: "Lizard", scientificName: "Sauria sp.", category: "reptiles_lizards" },
  "clover-species-tortue": { commonNameFr: "Tortue", commonNameEn: "Turtle", scientificName: "Testudines sp.", category: "reptiles_turtles" },
  "clover-species-amphibien": { commonNameFr: "Amphibien", commonNameEn: "Amphibian", scientificName: "Amphibia sp.", category: "amphibians_other" },
  "clover-species-arachnide": { commonNameFr: "Arachnide", commonNameEn: "Arachnid", scientificName: "Arachnida sp.", category: "invertebrates_arachnids" },
  "clover-species-insect": { commonNameFr: "Insecte", commonNameEn: "Insect", scientificName: "Insecta sp.", category: "invertebrates_insects" },
  "clover-species-invertebrate": { commonNameFr: "Invertébré", commonNameEn: "Invertebrate", scientificName: "Invertebrata sp.", category: "invertebrates_other" },
  "clover-species-generic": { commonNameFr: "Reptile", commonNameEn: "Reptile", scientificName: "Reptilia sp.", category: "reptiles_other" },
};

async function ensurePlaceholderSpecies(): Promise<void> {
  for (const [id, meta] of Object.entries(SPECIES_UPSERTS)) {
    await prisma.species.upsert({
      where: { id },
      create: { id, ...meta },
      update: { category: meta.category },
    });
  }
}

async function main() {
  const animals = await prisma.animal.findMany({
    where: { speciesId: { startsWith: PLACEHOLDER_PREFIX } },
    include: { species: true },
  });

  const byTarget = new Map<AnimalCategoryValue, number>();
  const moves: { id: string; morph: string; from: string; to: AnimalCategoryValue }[] = [];

  for (const animal of animals) {
    const candidate = animal.cloverItemId
      ? await prisma.cloverImportCandidate.findUnique({ where: { cloverItemId: animal.cloverItemId } })
      : null;
    const target = inferAnimalCategoryFromMorph(animal.morph, candidate?.cloverCategoryName);
    if (target === animal.species.category) continue;

    moves.push({
      id: animal.id,
      morph: animal.morph,
      from: animal.species.category,
      to: target,
    });
    byTarget.set(target, (byTarget.get(target) ?? 0) + 1);
  }

  console.log(`Animals on Clover placeholders: ${animals.length}`);
  console.log(`Would reclassify: ${moves.length}`);
  for (const [cat, count] of [...byTarget.entries()].sort((a, b) => b[1] - a[1])) {
    console.log(`  → ${cat}: ${count}`);
  }
  for (const row of moves.slice(0, 10)) {
    console.log(`  ${row.from} → ${row.to}: ${row.morph.slice(0, 60)}`);
  }
  if (moves.length > 10) console.log(`  … and ${moves.length - 10} more`);

  if (!apply) {
    console.log("\nDry run — pass --apply to update.");
    return;
  }

  await ensurePlaceholderSpecies();

  let updated = 0;
  for (const row of moves) {
    const speciesId = CLOVER_SPECIES_ID_BY_CATEGORY[row.to];
    await prisma.animal.update({ where: { id: row.id }, data: { speciesId } });
    updated++;
  }
  console.log(`\nDone — ${updated} animal(aux) reclassifié(s).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
