/**
 * Apply finalized inventory triage (inventaire-final.xlsx) to Neon DB.
 *
 * - ignorar → candidate status ignored
 * - animal → candidate cloverCategoryName set, stays pending (→ /animals later)
 * - product → update/create Product with site category; candidate updated
 * - Saves CloverCategoryRule for merchandise categories (future auto-import)
 *
 * Run:
 *   npm run inventory:apply-triage          # dry-run
 *   npm run inventory:apply-triage -- --apply
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config();

import { readFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import ExcelJS from "exceljs";
import type { ProductCategoryValue } from "../src/lib/product-categories";
import { isProductCategory } from "../src/lib/product-categories";
import { looksLikeAnimalCategory } from "../src/lib/clover-category-mapping";
import {
  createProductFromCloverData,
  saveCloverCategoryRule,
} from "../src/lib/clover-sync";
import { EXISTING_CLOVER_CATEGORIES } from "./inventory-classifier";

const XLSX_PATH = join(process.cwd(), "exports/inventaire-final.xlsx");

const VALID_CLOVER = new Set<string>([...EXISTING_CLOVER_CATEGORIES]);

const MERCH_RULES: { clover: string; site: ProductCategoryValue }[] = [
  { clover: "Habitat", site: "terrarium" },
  { clover: "Substrat", site: "substrate" },
  { clover: "Decoration", site: "decor" },
  { clover: "Roche Et Bois/Cork", site: "decor" },
  { clover: "Plante Vivant", site: "decor" },
  { clover: "Lumiere", site: "lighting" },
  { clover: "Piece Remplacement/ Electronique", site: "equipment" },
  { clover: "Insecte Vivant", site: "food_live" },
  { clover: "Nourriture", site: "food_packaged" },
  { clover: "Supplement", site: "supplement" },
];

type TriageRow = {
  cloverItemId: string;
  name: string;
  priceCAD: number;
  stockCount: number | null;
  queueStatus: string;
  cloverCategory: string;
  siteCategory: string;
  tipo: "product" | "animal" | "ignorar";
};

async function loadTriageRows(): Promise<TriageRow[]> {
  if (!existsSync(XLSX_PATH)) {
    throw new Error(`Missing ${XLSX_PATH} — run npm run inventory:finalize first`);
  }

  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(XLSX_PATH);
  const ws =
    wb.worksheets.find((s) => s.name.includes("Sin categor")) ??
    wb.worksheets.find((s) => s.rowCount > 10)!;

  const headers: string[] = [];
  ws.getRow(1).eachCell({ includeEmpty: true }, (c, i) => {
    headers[i] = String(c.value ?? "");
  });

  const col = (name: string) => headers.findIndex((h) => h === name);
  const colInc = (part: string) => headers.findIndex((h) => h?.includes(part));

  const iId = col("cloverItemId");
  const iName = col("name");
  const iPrice = col("priceCAD");
  const iStock = col("stockCount");
  const iStatus = col("queue_status");
  const iK = colInc("ELEGIR categoria Clover");
  const iL = colInc("ELEGIR categoria sitio");
  const iM = colInc("ELEGIR tipo");

  const rows: TriageRow[] = [];
  for (let r = 2; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const id = row.getCell(iId).value;
    if (!id) continue;

    const tipoRaw = String(row.getCell(iM).value ?? "").trim();
    if (tipoRaw !== "product" && tipoRaw !== "animal" && tipoRaw !== "ignorar") {
      console.warn(`  skip row ${r}: invalid tipo "${tipoRaw}"`);
      continue;
    }

    rows.push({
      cloverItemId: String(id),
      name: String(row.getCell(iName).value ?? ""),
      priceCAD: Number(row.getCell(iPrice).value ?? 0),
      stockCount: row.getCell(iStock).value != null ? Number(row.getCell(iStock).value) : null,
      queueStatus: String(row.getCell(iStatus).value ?? ""),
      cloverCategory: String(row.getCell(iK).value ?? "").trim(),
      siteCategory: String(row.getCell(iL).value ?? "").trim(),
      tipo: tipoRaw,
    });
  }
  return rows;
}

async function main() {
  const apply = process.argv.includes("--apply");
  const rows = await loadTriageRows();
  const { prisma } = await import("../src/lib/db");

  const stats = {
    ignorar: 0,
    animal: 0,
    productUpdated: 0,
    productCreated: 0,
    candidateUpdated: 0,
    skipped: 0,
    warnings: [] as string[],
  };

  console.log(apply ? "=== APPLY MODE ===" : "=== DRY RUN (pass --apply to execute) ===");
  console.log(`Rows loaded: ${rows.length}`);

  if (apply) {
    for (const rule of MERCH_RULES) {
      if (!looksLikeAnimalCategory(rule.clover)) {
        await saveCloverCategoryRule(rule.clover, "auto_product", rule.site);
      }
    }
    console.log(`Saved ${MERCH_RULES.length} CloverCategoryRules for merchandise`);
  }

  for (const row of rows) {
    const candidate = await prisma.cloverImportCandidate.findUnique({
      where: { cloverItemId: row.cloverItemId },
    });

    if (row.tipo === "ignorar") {
      if (candidate && candidate.status === "pending") {
        if (apply) {
          await prisma.cloverImportCandidate.update({
            where: { cloverItemId: row.cloverItemId },
            data: { status: "ignored" },
          });
        }
        stats.ignorar++;
      }
      continue;
    }

    if (row.cloverCategory && !VALID_CLOVER.has(row.cloverCategory)) {
      stats.warnings.push(`${row.cloverItemId}: invalid clover "${row.cloverCategory}"`);
      stats.skipped++;
      continue;
    }

    if (row.tipo === "animal") {
      if (apply && candidate) {
        await prisma.cloverImportCandidate.update({
          where: { cloverItemId: row.cloverItemId },
          data: { cloverCategoryName: row.cloverCategory || null },
        });
      }
      stats.animal++;
      stats.candidateUpdated++;
      continue;
    }

    // product
    if (!row.siteCategory || !isProductCategory(row.siteCategory)) {
      stats.warnings.push(`${row.cloverItemId}: product missing valid site category`);
      stats.skipped++;
      continue;
    }

    const existingProduct = await prisma.product.findUnique({
      where: { cloverItemId: row.cloverItemId },
    });

    if (apply) {
      if (candidate) {
        await prisma.cloverImportCandidate.update({
          where: { cloverItemId: row.cloverItemId },
          data: { cloverCategoryName: row.cloverCategory || null },
        });
        stats.candidateUpdated++;
      }

      if (existingProduct) {
        await prisma.product.update({
          where: { id: existingProduct.id },
          data: { category: row.siteCategory },
        });
        stats.productUpdated++;
      } else {
        const ok = await createProductFromCloverData({
          cloverItemId: row.cloverItemId,
          name: row.name,
          priceCAD: row.priceCAD,
          stockCount: row.stockCount,
          productCategory: row.siteCategory,
        });
        if (ok) {
          if (candidate) {
            await prisma.cloverImportCandidate.update({
              where: { cloverItemId: row.cloverItemId },
              data: { status: "created" },
            });
          }
          stats.productCreated++;
        } else {
          stats.skipped++;
        }
      }
    } else {
      if (existingProduct) stats.productUpdated++;
      else stats.productCreated++;
      stats.candidateUpdated++;
    }
  }

  console.log("\nStats:", stats);
  if (stats.warnings.length) {
    console.log("\nWarnings (first 15):");
    stats.warnings.slice(0, 15).forEach((w) => console.log(" ", w));
  }

  if (!apply) {
    console.log("\nRe-run with --apply to write to database.");
  }

  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
