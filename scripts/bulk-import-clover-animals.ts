/**
 * One-time backfill: turn pending CloverImportCandidate rows whose category
 * is a live-animal bucket into Animal records (Serpent, Lezard, etc.).
 *
 * Usage:
 *   npm run inventory:bulk-import-animals          # dry-run counts
 *   npm run inventory:bulk-import-animals -- --apply
 */
import "dotenv/config";
import { prisma } from "../src/lib/db";
import { looksLikeAnimalCategory } from "../src/lib/clover-category-mapping";
import { bulkCreateAnimalsFromCategory } from "../src/lib/clover-sync";

const apply = process.argv.includes("--apply");

async function main() {
  const grouped = await prisma.cloverImportCandidate.groupBy({
    by: ["cloverCategoryName"],
    where: { status: "pending" },
    _count: { _all: true },
  });

  const animalGroups = grouped.filter((g) => looksLikeAnimalCategory(g.cloverCategoryName));
  const totalPending = animalGroups.reduce((sum, g) => sum + g._count._all, 0);

  console.log(`Pending animal-category candidates: ${totalPending}`);
  for (const g of animalGroups.sort((a, b) => b._count._all - a._count._all)) {
    console.log(`  ${g.cloverCategoryName ?? "(sans catégorie)"}: ${g._count._all}`);
  }

  if (!apply) {
    console.log("\nDry run — pass --apply to create animals.");
    return;
  }

  let created = 0;
  let skipped = 0;
  for (const g of animalGroups) {
    const result = await bulkCreateAnimalsFromCategory(g.cloverCategoryName);
    created += result.created;
    skipped += result.skipped;
    console.log(
      `${g.cloverCategoryName ?? "(sans catégorie)"}: ${result.created} créé(s), ${result.skipped} ignoré(s)`,
    );
  }

  console.log(`\nDone — ${created} animal(aux) créé(s), ${skipped} ignoré(s).`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
