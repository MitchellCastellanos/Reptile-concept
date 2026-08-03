/**
 * Fix animals wrongly auto-imported as pets when they are feeder/live merch:
 * - Rongeur → Product (food_live / food_frozen / food_packaged by name)
 * - Isopod et Araignee… isopod colonies → Product food_live
 * Keeps tarantulas/spiders as Animal records.
 *
 *   npm run inventory:fix-live-food-misimport
 *   npm run inventory:fix-live-food-misimport -- --apply
 */
import "dotenv/config";
import { prisma } from "../src/lib/db";
import { resolveCloverImportRoute } from "../src/lib/clover-category-mapping";
import { createProductFromCloverData } from "../src/lib/clover-sync";

const apply = process.argv.includes("--apply");

async function main() {
  const misplaced = await prisma.animal.findMany({
    where: {
      speciesId: { in: ["clover-species-rongeur", "clover-species-invertebrate"] },
    },
    select: {
      id: true,
      morph: true,
      priceCAD: true,
      status: true,
      cloverItemId: true,
      speciesId: true,
    },
  });

  const toConvert: {
    animalId: string;
    cloverItemId: string;
    name: string;
    priceCAD: number;
    stockCount: number;
    cloverCategoryName: string | null;
    productCategory: "food_live" | "food_frozen" | "food_packaged" | "decor" | "supplement";
  }[] = [];

  const toKeep: typeof misplaced = [];

  for (const animal of misplaced) {
    if (!animal.cloverItemId) continue;

    const candidate = await prisma.cloverImportCandidate.findUnique({
      where: { cloverItemId: animal.cloverItemId },
    });
    const cloverCategoryName = candidate?.cloverCategoryName ?? null;
    const route = resolveCloverImportRoute(cloverCategoryName, animal.morph);

    if (route.kind === "auto_product") {
      toConvert.push({
        animalId: animal.id,
        cloverItemId: animal.cloverItemId,
        name: animal.morph,
        priceCAD: Number(animal.priceCAD),
        stockCount: animal.status === "available" ? Math.max(1, candidate?.stockCount ?? 1) : 0,
        cloverCategoryName,
        productCategory: route.productCategory,
      });
    } else if (route.kind === "animal") {
      toKeep.push(animal);
    } else {
      // Invertebrate placeholder but no clear product route — default isopods to food_live
      if (animal.speciesId === "clover-species-invertebrate" && /\bisopod/i.test(animal.morph)) {
        toConvert.push({
          animalId: animal.id,
          cloverItemId: animal.cloverItemId,
          name: animal.morph,
          priceCAD: Number(animal.priceCAD),
          stockCount: animal.status === "available" ? Math.max(1, candidate?.stockCount ?? 1) : 0,
          cloverCategoryName,
          productCategory: "food_live",
        });
      } else {
        toKeep.push(animal);
      }
    }
  }

  console.log(`Misplaced feeder animals to convert: ${toConvert.length}`);
  console.log(`Pet invertebrates to keep as animals: ${toKeep.length}`);
  for (const row of toConvert.slice(0, 8)) {
    console.log(`  → ${row.productCategory}: ${row.name}`);
  }
  if (toConvert.length > 8) console.log(`  … and ${toConvert.length - 8} more`);

  if (!apply) {
    console.log("\nDry run — pass --apply to convert.");
    return;
  }

  let converted = 0;
  let failed = 0;
  for (const row of toConvert) {
    const existingProduct = await prisma.product.findUnique({ where: { cloverItemId: row.cloverItemId } });
    if (existingProduct) {
      await prisma.animal.delete({ where: { id: row.animalId } });
      converted++;
      continue;
    }

    const ok = await createProductFromCloverData({
      cloverItemId: row.cloverItemId,
      name: row.name,
      priceCAD: row.priceCAD,
      stockCount: row.stockCount,
      productCategory: row.productCategory,
      published: true,
    });

    if (ok) {
      await prisma.animal.delete({ where: { id: row.animalId } });
      await prisma.cloverImportCandidate.updateMany({
        where: { cloverItemId: row.cloverItemId },
        data: { status: "created" },
      });
      converted++;
    } else {
      failed++;
    }
  }

  console.log(`\nDone — ${converted} converti(s) en produit, ${failed} échec(s).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
