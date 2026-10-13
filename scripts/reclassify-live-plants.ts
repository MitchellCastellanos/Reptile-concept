/**
 * Move Clover "Plante Vivant" products from decor to the live_plants category,
 * and repoint any CloverCategoryRule for that Clover category.
 *
 *   npm run inventory:reclassify-live-plants
 *   npm run inventory:reclassify-live-plants -- --apply
 */
import "dotenv/config";
import { prisma } from "../src/lib/db";

const apply = process.argv.includes("--apply");
const CLOVER_CATEGORY = "plante vivant";

async function main() {
  const candidates = await prisma.cloverImportCandidate.findMany({
    where: { cloverCategoryName: { equals: CLOVER_CATEGORY, mode: "insensitive" } },
    select: { cloverItemId: true },
  });
  const cloverItemIds = candidates.map((c) => c.cloverItemId);

  const products = await prisma.product.findMany({
    where: { cloverItemId: { in: cloverItemIds }, category: { not: "live_plants" } },
    select: { id: true, nameFr: true, category: true },
  });
  const rules = await prisma.cloverCategoryRule.findMany({
    where: {
      cloverCategoryName: { equals: CLOVER_CATEGORY, mode: "insensitive" },
      productCategory: { not: "live_plants" },
    },
  });

  console.log(`Clover "Plante Vivant" items seen: ${cloverItemIds.length}`);
  console.log(`Products to move to live_plants: ${products.length}`);
  for (const p of products.slice(0, 10)) console.log(`  ${p.category} → live_plants: ${p.nameFr}`);
  if (products.length > 10) console.log(`  … and ${products.length - 10} more`);
  console.log(`Category rules to repoint: ${rules.length}`);

  if (!apply) {
    console.log("\nDry run — pass --apply to update.");
    return;
  }

  const res = await prisma.product.updateMany({
    where: { id: { in: products.map((p) => p.id) } },
    data: { category: "live_plants" },
  });
  const ruleRes = await prisma.cloverCategoryRule.updateMany({
    where: { id: { in: rules.map((r) => r.id) } },
    data: { productCategory: "live_plants" },
  });
  console.log(`\nDone — ${res.count} produit(s), ${ruleRes.count} règle(s) mis à jour.`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
