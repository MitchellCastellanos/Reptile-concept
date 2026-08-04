/**
 * Fix animals wrongly auto-created as live pets when they are food/consumables
 * filed under a live-animal Clover category (Gecko Food under "Gecko", etc.).
 *
 * Mirrors convertAnimalToProductAction but batch-creates Products and archives
 * Animals (not_for_sale, cloverItemId cleared) — one Prisma transaction per item.
 *
 *   npm run inventory:fix-animal-category-food-misimport
 *   npm run inventory:fix-animal-category-food-misimport -- --apply
 *   npm run inventory:fix-animal-category-food-misimport -- --check-products
 */
import { config } from "dotenv";
config({ path: ".env.production.local" });
config({ path: ".env.local" });
config();

import { prisma } from "../src/lib/db";
import {
  matchesFoodOrConsumableName,
  productCategoryForRongeurItem,
  resolveCloverImportRoute,
} from "../src/lib/clover-category-mapping";
import type { ProductCategoryValue } from "../src/lib/product-categories";

const apply = process.argv.includes("--apply");
const checkProducts = process.argv.includes("--check-products") || apply;

/** Placeholder species used by createAnimalFromCloverData for live-animal buckets. */
const LIVE_ANIMAL_PLACEHOLDER_SPECIES = [
  "clover-species-serpent",
  "clover-species-gecko",
  "clover-species-lezard",
  "clover-species-tortue",
  "clover-species-amphibien",
] as const;

function searchableText(animal: {
  morph: string;
  descriptionFr: string;
  descriptionEn: string;
}): string {
  return [animal.morph, animal.descriptionFr, animal.descriptionEn].join(" ");
}

function productCategoryForMisclassifiedItem(name: string): ProductCategoryValue {
  const fromRongeur = productCategoryForRongeurItem(name);
  if (fromRongeur !== "food_live") return fromRongeur;
  return "food_packaged";
}

function formatPrice(price: { toString(): string } | number): string {
  return Number(price).toFixed(2);
}

async function findMisclassifiedAnimals() {
  const animals = await prisma.animal.findMany({
    where: {
      OR: [
        { speciesId: { in: [...LIVE_ANIMAL_PLACEHOLDER_SPECIES] } },
        { cloverItemId: { not: null } },
      ],
    },
    select: {
      id: true,
      morph: true,
      descriptionFr: true,
      descriptionEn: true,
      cloverItemId: true,
      priceCAD: true,
      status: true,
      species: { select: { category: true, commonNameFr: true, id: true } },
    },
    orderBy: { morph: "asc" },
  });

  const withProductCloverIds = new Set(
    (
      await prisma.product.findMany({
        where: { cloverItemId: { not: null } },
        select: { cloverItemId: true },
      })
    )
      .map((p) => p.cloverItemId)
      .filter(Boolean) as string[],
  );

  return animals.filter((a) => {
    if (!matchesFoodOrConsumableName(searchableText(a))) return false;
    // Placeholder-species imports are always suspect.
    if ((LIVE_ANIMAL_PLACEHOLDER_SPECIES as readonly string[]).includes(a.species.id)) return true;
    // Also catch food names linked to a real species when no Product exists yet.
    return a.cloverItemId != null && !withProductCloverIds.has(a.cloverItemId);
  });
}

async function dryRunAnimals() {
  const matches = await findMisclassifiedAnimals();

  console.log(`\n=== Tarea 1 — Animals mal clasificados (food bajo categoría live) ===`);
  console.log(`Encontrados: ${matches.length}\n`);

  if (matches.length === 0) {
    console.log("Nada que corregir.");
    return matches;
  }

  console.table(
    matches.map((a) => ({
      id: a.id,
      morph: a.morph,
      cloverItemId: a.cloverItemId ?? "(none)",
      priceCAD: formatPrice(a.priceCAD),
      animalCategory: a.species.category,
      speciesId: a.species.id,
      status: a.status,
      productCategory: productCategoryForMisclassifiedItem(a.morph),
    })),
  );

  return matches;
}

async function applyAnimalFixes(
  matches: Awaited<ReturnType<typeof findMisclassifiedAnimals>>,
) {
  let converted = 0;
  let skipped = 0;
  let failed = 0;

  for (const animal of matches) {
    const name = animal.morph;
    const cloverItemId = animal.cloverItemId;
    const sku = cloverItemId ?? `misimport-animal-${animal.id}`;
    const productCategory = productCategoryForMisclassifiedItem(name);

    try {
      await prisma.$transaction(async (tx) => {
        const existingByClover =
          cloverItemId != null
            ? await tx.product.findUnique({ where: { cloverItemId } })
            : null;
        const existingBySku = await tx.product.findUnique({ where: { sku } });

        if (!existingByClover && !existingBySku) {
          await tx.product.create({
            data: {
              sku,
              category: productCategory,
              nameFr: name,
              nameEn: name,
              priceCAD: animal.priceCAD,
              stockQty: 0,
              cloverItemId,
              published: false,
            },
          });
        }

        await tx.animal.update({
          where: { id: animal.id },
          data: { cloverItemId: null, status: "not_for_sale" },
        });
      });
      converted++;
      console.log(`  ✓ ${name} → product (${productCategory})`);
    } catch (err) {
      failed++;
      console.error(`  ✗ ${name}:`, err);
    }
  }

  console.log(`\nAnimals: ${converted} convertido(s), ${skipped} omitido(s), ${failed} error(es).`);
  return { converted, skipped, failed };
}

/** Products auto-created via rongeur / insecte vivant / isopod routes that look like live pets. */
async function findMisclassifiedProducts() {
  const products = await prisma.product.findMany({
    where: { cloverItemId: { not: null } },
    select: {
      id: true,
      nameFr: true,
      category: true,
      cloverItemId: true,
      priceCAD: true,
      published: true,
    },
    orderBy: { nameFr: "asc" },
  });

  const candidates = await prisma.cloverImportCandidate.findMany({
    where: { cloverItemId: { in: products.map((p) => p.cloverItemId!).filter(Boolean) } },
    select: { cloverItemId: true, cloverCategoryName: true },
  });
  const cloverCatById = new Map(candidates.map((c) => [c.cloverItemId, c.cloverCategoryName]));

  const misclassified: {
    id: string;
    nameFr: string;
    cloverItemId: string;
    productCategory: string;
    cloverCategory: string | null;
    expectedRoute: string;
  }[] = [];

  for (const p of products) {
    if (!p.cloverItemId) continue;
    const cloverCategory = cloverCatById.get(p.cloverItemId) ?? null;
    const route = resolveCloverImportRoute(cloverCategory, p.nameFr);
    const cat = cloverCategory?.toLowerCase() ?? "";

    // Only flag auto_product routes in feeder/mixed buckets where the name
    // looks like a live pet, not food or habitat merch.
    const isAutoProductFeederRoute =
      cat === "rongeur" ||
      cat === "insecte vivant" ||
      /isopod|araignee|araignée|fourmis/.test(cat);

    if (
      isAutoProductFeederRoute &&
      route.kind === "auto_product" &&
      route.productCategory.startsWith("food") &&
      /\b(tarantula|araignée|araignee|spider|tliltocatl|acanthoscurria|python|ball python|corn snake|boas?|gecko(?! diet| food)|serpent|lezard|lézard|grenouille|frog|tortue)\b/i.test(
        p.nameFr,
      ) &&
      !matchesFoodOrConsumableName(p.nameFr) &&
      !/\b(frozen|congel|feeder|qty|colonie|isopod|cricket|grillon|rat |mouse|souris|terrarium|habitat|grotte|bol gecko)\b/i.test(
        p.nameFr,
      )
    ) {
      misclassified.push({
        id: p.id,
        nameFr: p.nameFr,
        cloverItemId: p.cloverItemId,
        productCategory: p.category,
        cloverCategory,
        expectedRoute: "animal (live pet in feeder auto-route)",
      });
    }
  }

  return misclassified;
}

async function dryRunProducts() {
  const matches = await findMisclassifiedProducts();

  console.log(`\n=== Tarea 2 — Products posiblemente mal clasificados ===`);
  console.log(`Encontrados: ${matches.length}\n`);

  if (matches.length === 0) {
    console.log("Nada sospechoso en Products.");
    return matches;
  }

  console.table(matches);
  return matches;
}

async function main() {
  const animalMatches = await dryRunAnimals();

  if (checkProducts) {
    await dryRunProducts();
  }

  if (!apply) {
    console.log("\nDry run — pass --apply to convert animals (requires explicit confirmation).");
    return;
  }

  if (animalMatches.length === 0) return;

  console.log("\n=== Aplicando correcciones (modo escritura) ===");
  await applyAnimalFixes(animalMatches);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
