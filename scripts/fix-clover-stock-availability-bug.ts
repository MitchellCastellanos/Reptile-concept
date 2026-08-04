/**
 * Data backfill for the Clover stock-count availability bug (see
 * docs/cahier-de-charges.md, 2026-08-04 entry).
 *
 * This merchant's Clover animal items use "Manually manage availability",
 * where the Item stock count field and the Available toggle are edited
 * independently by staff — most animals sit at stockCount=0 while still
 * genuinely for sale. Before the code fix, both the initial bulk import
 * (scripts/bulk-import-clover-animals.ts -> createAnimalFromCloverData) and
 * every catalog resync (clover-sync.ts -> syncLinkedAnimalFromItem) treated
 * stockCount<=0 as "sold", so most Clover-linked animals were marked sold on
 * creation or flipped to sold on a later sync, without ever actually selling.
 *
 * This reverts status "sold" -> "available" for Clover-linked animals that
 * have zero evidence of a real sale anywhere in the system (no CloverSaleItem,
 * OrderItem, or PosSaleItem referencing them). Animals with a real sale
 * record, or with any other status (reserved/on_hold/not_for_sale), are left
 * untouched.
 *
 * Usage:
 *   npm run inventory:fix-clover-stock-availability-bug            # dry-run
 *   npm run inventory:fix-clover-stock-availability-bug -- --apply
 */
import { config } from "dotenv";
config({ path: ".env.production.local" });
config({ path: ".env.local" });
config();

import { prisma } from "../src/lib/db";

const apply = process.argv.includes("--apply");

async function findWronglySoldAnimals() {
  const soldLinkedAnimals = await prisma.animal.findMany({
    where: { status: "sold", cloverItemId: { not: null } },
    select: {
      id: true,
      morph: true,
      cloverItemId: true,
      priceCAD: true,
      species: { select: { commonNameFr: true } },
      _count: {
        select: { cloverSaleItems: true, orderItems: true, posSaleItems: true },
      },
    },
    orderBy: { morph: "asc" },
  });

  return soldLinkedAnimals.filter(
    (a) => a._count.cloverSaleItems === 0 && a._count.orderItems === 0 && a._count.posSaleItems === 0,
  );
}

async function main() {
  const wronglySold = await findWronglySoldAnimals();

  console.log(`\n=== Animaux Clover marqués "sold" sans aucune trace de vente ===`);
  console.log(`Trouvés : ${wronglySold.length}\n`);

  if (wronglySold.length === 0) {
    console.log("Rien à corriger.");
    return;
  }

  console.table(
    wronglySold.map((a) => ({
      id: a.id,
      morph: a.morph,
      espece: a.species.commonNameFr,
      cloverItemId: a.cloverItemId,
      priceCAD: Number(a.priceCAD).toFixed(2),
    })),
  );

  if (!apply) {
    console.log("\nDry run — passe --apply pour remettre ces animaux à \"available\".");
    return;
  }

  const result = await prisma.animal.updateMany({
    where: { id: { in: wronglySold.map((a) => a.id) } },
    data: { status: "available" },
  });

  console.log(`\n${result.count} animal(aux) remis à "available".`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
