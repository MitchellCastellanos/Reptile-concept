/**
 * Remove demo seed data from Neon and migrate real inventory off seed-* species.
 *
 * Run: npm run inventory:delete-seed-data
 *      npm run inventory:delete-seed-data -- --apply
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config();

import { prisma } from "../src/lib/db";
import {
  inferSpeciesCandidate,
  isMerchandiseMisimportedAsAnimal,
  normalizeScientificNameKey,
} from "../src/lib/species-candidates";
import { createProductFromCloverData } from "../src/lib/clover-sync";
import { resolveCloverImportRoute } from "../src/lib/clover-category-mapping";

const apply = process.argv.includes("--apply");

const DEMO_PRODUCT_SKUS = [
  "TERRA-40G",
  "TERRA-20G",
  "SUBSTRATE-COCO",
  "DECOR-BRANCH",
  "FOOD-CRICKET",
  "FOOD-ROACH",
  "UVB-LAMP",
  "HEAT-MAT",
];

const CANONICAL_DONOR: Record<string, string> = {
  "python regius": "b4d0a524-f4e4-4d2b-9092-d50357b18b65",
  "correlophus ciliatus": "f0b10532-dde7-436a-97e7-52897067d217",
  "pantherophis guttatus": "6e495d95-8faa-4181-8edf-2bd761034dbf",
  "pogona vitticeps": "9a7d5e30-7296-4598-a91b-7e0b7284a64b",
  "eublepharis macularius": "a09654ed-242d-4b67-9435-ed1f375442c4",
  "trioceros jacksonii xantholophus": "431cfe88-5199-43b5-8b1c-213530988f06",
};

/** seed species id → preferred non-seed donor (same taxon, with care sheet). */
const SEED_SPECIES_DONOR: Record<string, string> = {
  "seed-ball-python": CANONICAL_DONOR["python regius"],
  "seed-crested-gecko": CANONICAL_DONOR["correlophus ciliatus"],
  "seed-corn-snake": CANONICAL_DONOR["pantherophis guttatus"],
  "seed-bearded-dragon": CANONICAL_DONOR["pogona vitticeps"],
  "seed-leopard-gecko": CANONICAL_DONOR["eublepharis macularius"],
  "seed-jackson-chameleon": CANONICAL_DONOR["trioceros jacksonii xantholophus"],
};

function productCategoryForMerch(name: string, cloverCategory: string | null) {
  const route = resolveCloverImportRoute(cloverCategory, name);
  if (route.kind === "auto_product") return route.productCategory;
  if (/food|diet|repashy|pangea|hikari/i.test(name)) return "food_packaged" as const;
  return "food_packaged" as const;
}

async function findDonorForSeed(seedId: string, scientificName: string, commonNameEn: string) {
  const preset = SEED_SPECIES_DONOR[seedId];
  if (preset && !preset.startsWith("seed-")) {
    const found = await prisma.species.findUnique({ where: { id: preset } });
    if (found) return found.id;
  }

  const key = normalizeScientificNameKey(scientificName);
  const byKey = await prisma.species.findMany({
    where: {
      id: { not: { startsWith: "seed-" } },
      descriptionEn: { not: null },
      NOT: { descriptionEn: "" },
    },
    select: { id: true, scientificName: true, commonNameEn: true },
  });

  const exact = byKey.find((s) => normalizeScientificNameKey(s.scientificName) === key);
  if (exact) return exact.id;

  const common = commonNameEn.toLowerCase();
  const byCommon = byKey.find((s) => s.commonNameEn.toLowerCase() === common);
  if (byCommon) return byCommon.id;

  return null;
}

async function migrateOffSeedSpecies() {
  const seedSpecies = await prisma.species.findMany({
    where: { id: { startsWith: "seed-" } },
    select: { id: true, scientificName: true, commonNameEn: true },
  });

  let migrated = 0;
  for (const seed of seedSpecies) {
    const donorId = await findDonorForSeed(seed.id, seed.scientificName, seed.commonNameEn);
    if (!donorId || donorId === seed.id) {
      console.warn(`No donor for seed species ${seed.id} (${seed.scientificName})`);
      continue;
    }
    const count = await prisma.animal.count({ where: { speciesId: seed.id } });
    if (count === 0) continue;
    if (apply) {
      await prisma.animal.updateMany({
        where: { speciesId: seed.id },
        data: { speciesId: donorId },
      });
    }
    console.log(`Migrate ${count} animals: ${seed.scientificName} → donor ${donorId}`);
    migrated += count;
  }
  return migrated;
}

async function convertMerchAnimals() {
  const animals = await prisma.animal.findMany({
    where: {
      id: { not: { startsWith: "seed-" } },
      cloverItemId: { not: null },
    },
    select: {
      id: true,
      morph: true,
      cloverItemId: true,
      priceCAD: true,
      status: true,
    },
  });

  const meta = await prisma.cloverImportCandidate.findMany({
    where: { status: "created" },
    select: { cloverItemId: true, cloverCategoryName: true, stockCount: true },
  });
  const cloverCatById = new Map(meta.map((c) => [c.cloverItemId, c.cloverCategoryName ?? ""]));
  const stockById = new Map(meta.map((c) => [c.cloverItemId, c.stockCount ?? 0]));

  let converted = 0;
  for (const a of animals) {
    if (!isMerchandiseMisimportedAsAnimal(a.morph) || !a.cloverItemId) continue;

    const cloverCat = cloverCatById.get(a.cloverItemId) ?? null;
    const productCategory = productCategoryForMerch(a.morph, cloverCat);
    const existing = await prisma.product.findUnique({ where: { cloverItemId: a.cloverItemId } });

    if (!apply) {
      console.log(`Would convert merch → product: ${a.morph}`);
      converted++;
      continue;
    }

    if (existing) {
      await prisma.animal.delete({ where: { id: a.id } });
      converted++;
      continue;
    }

    const ok = await createProductFromCloverData({
      cloverItemId: a.cloverItemId,
      name: a.morph,
      priceCAD: Number(a.priceCAD),
      stockCount: a.status === "available" ? Math.max(1, stockById.get(a.cloverItemId) ?? 1) : 0,
      productCategory,
      published: true,
    });
    if (ok) {
      await prisma.animal.delete({ where: { id: a.id } });
      converted++;
    }
  }
  return converted;
}

async function relinkMislinkedAvailable() {
  const species = await prisma.species.findMany({
    where: { id: { not: { startsWith: "seed-" } } },
    select: { id: true, scientificName: true },
  });
  const speciesByKey = new Map(
    species.map((s) => [normalizeScientificNameKey(s.scientificName), s.id]),
  );

  const meta = await prisma.cloverImportCandidate.findMany({
    where: { status: "created" },
    select: { cloverItemId: true, cloverCategoryName: true },
  });
  const cloverCatById = new Map(meta.map((c) => [c.cloverItemId, c.cloverCategoryName ?? ""]));

  const animals = await prisma.animal.findMany({
    where: { status: "available", id: { not: { startsWith: "seed-" } } },
    select: { id: true, morph: true, speciesId: true, cloverItemId: true },
  });

  let relinked = 0;
  for (const a of animals) {
    const cloverCat = a.cloverItemId ? cloverCatById.get(a.cloverItemId) : null;
    const inferred = inferSpeciesCandidate(a.morph, cloverCat);
    if (!inferred) continue;

    const key = normalizeScientificNameKey(inferred.scientificName);
    const targetId = speciesByKey.get(key) ?? CANONICAL_DONOR[key];
    if (!targetId || targetId === a.speciesId || targetId.startsWith("seed-")) continue;

    if (apply) {
      await prisma.animal.update({ where: { id: a.id }, data: { speciesId: targetId } });
    }
    console.log(`Relink: ${a.morph} → ${inferred.scientificName}`);
    relinked++;
  }
  return relinked;
}

async function deleteSeedRecords() {
  const seedAnimalIds = (
    await prisma.animal.findMany({
      where: { id: { startsWith: "seed-" } },
      select: { id: true },
    })
  ).map((a) => a.id);

  if (!apply) {
    return {
      animals: seedAnimalIds.length,
      media: await prisma.media.count({ where: { id: { startsWith: "seed-" } } }),
      species: await prisma.species.count({ where: { id: { startsWith: "seed-" } } }),
      products: await prisma.product.count({ where: { sku: { in: DEMO_PRODUCT_SKUS } } }),
      announcements: await prisma.announcement.count({ where: { id: { startsWith: "seed-" } } }),
    };
  }

  await prisma.media.deleteMany({ where: { id: { startsWith: "seed-" } } });
  await prisma.animal.deleteMany({ where: { id: { startsWith: "seed-" } } });
  await prisma.product.deleteMany({ where: { sku: { in: DEMO_PRODUCT_SKUS } } });
  await prisma.announcement.deleteMany({ where: { id: { startsWith: "seed-" } } });
  await prisma.species.deleteMany({ where: { id: { startsWith: "seed-" } } });

  return {
    animals: seedAnimalIds.length,
    media: seedAnimalIds.length,
    species: 6,
    products: DEMO_PRODUCT_SKUS.length,
    announcements: 1,
  };
}

async function main() {
  console.log(apply ? "=== APPLY ===" : "=== DRY RUN ===");

  const migrated = await migrateOffSeedSpecies();
  const merch = await convertMerchAnimals();
  const relinked = await relinkMislinkedAvailable();
  // Re-migrate in case relink missed any; ensures no animals left on seed species before delete.
  const migratedAgain = await migrateOffSeedSpecies();
  const deleted = await deleteSeedRecords();

  console.log("\nSummary:");
  console.log(`  animals migrated off seed species: ${migrated + migratedAgain}`);
  console.log(`  merch converted to products: ${merch}`);
  console.log(`  available animals relinked: ${relinked}`);
  console.log(`  seed records removed:`, deleted);

  if (!apply) console.log("\nRe-run with --apply to execute.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
