/**
 * Phase 1: stock backfill from Clover + high-confidence product bulk create.
 * Run: npm run apply:inventory-phase1
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config();
import { prisma } from "../src/lib/db";
import { fetchCloverItemStock, isCloverConfigured } from "../src/lib/clover";
import { createProductFromCloverData } from "../src/lib/clover-sync";
import { classifyItem } from "./inventory-classifier";
import type { ProductCategoryValue } from "../src/lib/product-categories";

const BATCH = 25;

async function backfillLinkedProductStock() {
  const products = await prisma.product.findMany({
    where: { cloverItemId: { not: null } },
    select: { id: true, cloverItemId: true, stockQty: true },
  });

  let updated = 0;
  let unchanged = 0;
  let failed = 0;

  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    if (!p.cloverItemId) continue;
    try {
      const qty = await fetchCloverItemStock(p.cloverItemId);
      if (qty == null) {
        unchanged++;
        continue;
      }
      if (qty !== p.stockQty) {
        await prisma.product.update({ where: { id: p.id }, data: { stockQty: Math.max(0, qty) } });
        updated++;
      } else {
        unchanged++;
      }
      await prisma.cloverImportCandidate.updateMany({
        where: { cloverItemId: p.cloverItemId },
        data: { stockCount: qty },
      });
    } catch {
      failed++;
    }
    if ((i + 1) % BATCH === 0) {
      console.log(`  stock progress: ${i + 1}/${products.length}`);
    }
  }

  return { total: products.length, updated, unchanged, failed };
}

async function refreshPendingStock() {
  const pending = await prisma.cloverImportCandidate.findMany({
    where: { status: "pending" },
    select: { id: true, cloverItemId: true },
  });

  let updated = 0;
  for (let i = 0; i < pending.length; i++) {
    const c = pending[i];
    try {
      const qty = await fetchCloverItemStock(c.cloverItemId);
      if (qty != null) {
        await prisma.cloverImportCandidate.update({ where: { id: c.id }, data: { stockCount: qty } });
        updated++;
      }
    } catch {
      /* skip */
    }
    if ((i + 1) % BATCH === 0) console.log(`  pending stock: ${i + 1}/${pending.length}`);
  }
  return { total: pending.length, updated };
}

async function bulkCreateHighConfidenceProducts() {
  const pending = await prisma.cloverImportCandidate.findMany({ where: { status: "pending" } });
  let created = 0;
  let skipped = 0;

  for (const candidate of pending) {
    const c = classifyItem({ name: candidate.name, cloverCategoryName: candidate.cloverCategoryName });
    if (c.recordType !== "product" || c.confidence !== "high" || !c.suggestedSiteCategory) {
      continue;
    }

    const ok = await createProductFromCloverData({
      cloverItemId: candidate.cloverItemId,
      name: candidate.name,
      priceCAD: Number(candidate.priceCAD),
      stockCount: candidate.stockCount,
      productCategory: c.suggestedSiteCategory as ProductCategoryValue,
    });

    if (ok) {
      await prisma.cloverImportCandidate.update({
        where: { id: candidate.id },
        data: { status: "created" },
      });
      created++;
    } else {
      skipped++;
    }
  }

  return { created, skipped };
}

async function main() {
  const cloverReady = isCloverConfigured();

  if (cloverReady) {
    console.log("1/3 Backfilling stock on linked products…");
    const stock = await backfillLinkedProductStock();
    console.log(stock);

    console.log("2/3 Refreshing stock on pending candidates…");
    const pendingStock = await refreshPendingStock();
    console.log(pendingStock);
  } else {
    console.warn("⚠ Clover credentials missing — skipping stock backfill (add CLOVER_MERCHANT_ID + CLOVER_API_TOKEN to .env.local).");
  }

  console.log(`${cloverReady ? "3" : "1"}/… Bulk creating high-confidence products from pending queue…`);
  const bulk = await bulkCreateHighConfidenceProducts();
  console.log(bulk);

  console.log("\nDone. Re-run: npm run export:inventory-master");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
