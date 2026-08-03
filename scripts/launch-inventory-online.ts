/**
 * Sync price/stock from inventory/inventory-export.xlsx + publish all products.
 *
 * npm run inventory:launch-online           # dry-run
 * npm run inventory:launch-online -- --apply
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config();

import { execSync } from "node:child_process";
import { join } from "node:path";

const EXPORT = join(process.cwd(), "inventory/inventory-export.xlsx");

async function main() {
  const apply = process.argv.includes("--apply");
  const publishOnly = process.argv.includes("--publish-only");

  console.log(apply ? "=== APPLY ===" : "=== DRY RUN ===");

  const { prisma } = await import("../src/lib/db");

  if (!publishOnly) {
    const json = execSync(`python scripts/clover-export-to-json.py "${EXPORT}"`, {
      encoding: "utf-8",
    });
    const items: { id: string; name: string; price: number; qty: number | null }[] = JSON.parse(json);

    let productsUpdated = 0;
    let candidatesUpdated = 0;
    for (const item of items) {
      const product = await prisma.product.findUnique({ where: { cloverItemId: item.id } });
      if (product) {
        if (apply) {
          await prisma.product.update({
            where: { id: product.id },
            data: {
              priceCAD: item.price,
              ...(item.qty != null ? { stockQty: Math.max(0, item.qty) } : {}),
            },
          });
        }
        productsUpdated++;
      }
      const candidate = await prisma.cloverImportCandidate.findUnique({
        where: { cloverItemId: item.id },
      });
      if (candidate && apply) {
        await prisma.cloverImportCandidate.update({
          where: { cloverItemId: item.id },
          data: { name: item.name, priceCAD: item.price, stockCount: item.qty },
        });
      }
      if (candidate) candidatesUpdated++;
    }
    console.log({
      itemsInExport: items.length,
      productsUpdated,
      candidatesUpdated,
    });
  }

  const unpublishedBefore = await prisma.product.count({ where: { published: false } });
  if (apply) {
    await prisma.product.updateMany({ where: { published: false }, data: { published: true } });
  }
  const publishedTotal = await prisma.product.count({ where: { published: true } });

  console.log({
    unpublishedBefore,
    publishedTotalAfter: apply ? publishedTotal : "unchanged (dry-run)",
  });

  if (!apply) console.log("\nRe-run with --apply to sync + publish.");

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
