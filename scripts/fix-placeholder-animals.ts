/**
 * Finish placeholder cleanup: merch → products, link real animals, stub missing species.
 *
 * Run: npm run inventory:fix-placeholder-animals
 *      npm run inventory:fix-placeholder-animals -- --apply
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config();

import { prisma } from "../src/lib/db";
import { isCloverPlaceholderSpeciesId } from "../src/lib/admin-catalog-counts";
import {
  inferSpeciesCandidate,
  isMerchandiseMisimportedAsAnimal,
  normalizeScientificNameKey,
  canonicalScientificName,
} from "../src/lib/species-candidates";
import { inferAnimalCategoryFromMorph } from "../src/lib/animal-category-inference";
import { resolveCloverImportRoute } from "../src/lib/clover-category-mapping";
import { createProductFromCloverData } from "../src/lib/clover-sync";
import type { AnimalCategoryValue } from "../src/lib/animal-categories";

const apply = process.argv.includes("--apply");

function productCategoryForMerch(name: string, cloverCategory: string | null) {
  const route = resolveCloverImportRoute(cloverCategory, name);
  if (route.kind === "auto_product") return route.productCategory;
  if (/terrarium|habitat|faunarium|frog pond|dart frog terrarium/i.test(name)) return "terrarium" as const;
  if (/bol gecko|grotte|hide|cave/i.test(name)) return "decor" as const;
  return "food_packaged" as const;
}

async function ensureSpecies(
  scientificName: string,
  category: AnimalCategoryValue,
  bySci: Map<string, { id: string; scientificName: string }>,
) {
  const key = normalizeScientificNameKey(scientificName);
  const canonical = canonicalScientificName(scientificName);
  const found = bySci.get(key);
  if (found) return found.id;

  const label = canonical.split(/\s+/).slice(-2).join(" ") || canonical;
  const created = await prisma.species.create({
    data: {
      scientificName: canonical,
      commonNameFr: label,
      commonNameEn: label,
      category,
    },
  });
  bySci.set(key, created);
  return created.id;
}

async function main() {
  const [animals, species] = await Promise.all([
    prisma.animal.findMany({
      where: { speciesId: { startsWith: "clover-species-" } },
      select: {
        id: true,
        morph: true,
        speciesId: true,
        cloverItemId: true,
        priceCAD: true,
        status: true,
      },
    }),
    prisma.species.findMany({ select: { id: true, scientificName: true } }),
  ]);

  const createdMeta = await prisma.cloverImportCandidate.findMany({
    where: { status: "created" },
    select: { cloverItemId: true, cloverCategoryName: true, stockCount: true },
  });
  const cloverCatById = new Map(createdMeta.map((c) => [c.cloverItemId, c.cloverCategoryName ?? ""]));
  const stockById = new Map(createdMeta.map((c) => [c.cloverItemId, c.stockCount ?? 0]));

  const speciesByKey = new Map(
    species
      .filter((s) => !isCloverPlaceholderSpeciesId(s.id))
      .map((s) => [normalizeScientificNameKey(s.scientificName), s]),
  );

  const toProduct: typeof animals = [];
  const toLink: typeof animals = [];
  const unresolved: typeof animals = [];

  for (const a of animals) {
    const cloverCat = a.cloverItemId ? cloverCatById.get(a.cloverItemId) ?? null : null;
    if (isMerchandiseMisimportedAsAnimal(a.morph)) {
      toProduct.push(a);
      continue;
    }
    const inferred = inferSpeciesCandidate(a.morph, cloverCat);
    if (inferred) toLink.push(a);
    else unresolved.push(a);
  }

  console.log(`Placeholder animals: ${animals.length}`);
  console.log(`  → convert to product: ${toProduct.length}`);
  console.log(`  → link to species: ${toLink.length}`);
  console.log(`  → unresolved: ${unresolved.length}`);

  if (!apply) {
    console.log("\nDry run — pass --apply to execute.");
    toProduct.slice(0, 5).forEach((a) => console.log(`  product: ${a.morph}`));
    toLink.slice(0, 5).forEach((a) => console.log(`  link: ${a.morph}`));
    unresolved.forEach((a) => console.log(`  ? ${a.morph}`));
    return;
  }

  let converted = 0;
  for (const a of toProduct) {
    if (!a.cloverItemId) continue;
    const cloverCat = cloverCatById.get(a.cloverItemId) ?? null;
    const productCategory = productCategoryForMerch(a.morph, cloverCat);
    const existing = await prisma.product.findUnique({ where: { cloverItemId: a.cloverItemId } });
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
  console.log(`Converted ${converted} to products`);

  let linked = 0;
  let speciesCreated = 0;
  for (const a of toLink) {
    const cloverCat = a.cloverItemId ? cloverCatById.get(a.cloverItemId) ?? null : null;
    const inferred = inferSpeciesCandidate(a.morph, cloverCat)!;
    const before = speciesByKey.size;
    const speciesId = await ensureSpecies(inferred.scientificName, inferred.category, speciesByKey);
    if (speciesByKey.size > before) speciesCreated++;

    await prisma.animal.update({ where: { id: a.id }, data: { speciesId } });
    linked++;
  }
  console.log(`Linked ${linked} animals (${speciesCreated} stub species created)`);

  if (unresolved.length) {
    console.log("Still unresolved:");
    unresolved.forEach((a) => console.log(`  - ${a.morph}`));
  }

  const remaining = await prisma.animal.count({
    where: { speciesId: { startsWith: "clover-species-" } },
  });
  console.log(`\nAnimals still on placeholder: ${remaining}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
