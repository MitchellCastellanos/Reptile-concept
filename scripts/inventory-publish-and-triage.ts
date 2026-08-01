/**
 * 1. Publish products that had a real Clover category when imported
 * 2. Backfill stock from Clover API
 * 3. Export XLSX with dropdowns for uncategorized triage
 *
 * Run: npm run inventory:publish-and-triage
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config();

import { mkdirSync } from "node:fs";
import { join } from "node:path";
import ExcelJS from "exceljs";
import type { PrismaClient } from "../src/generated/prisma/client";
import { classifyItem, EXISTING_CLOVER_CATEGORIES } from "./inventory-classifier";
import { PRODUCT_CATEGORIES } from "../src/lib/product-categories";

const OUT_DIR = join(process.cwd(), "exports");
const XLSX_PATH = join(OUT_DIR, "sin-categoria-triage.xlsx");

const CLOVER_DROPDOWN = [...EXISTING_CLOVER_CATEGORIES];
const SITE_DROPDOWN = [...PRODUCT_CATEGORIES];
const TIPO_DROPDOWN = ["product", "animal", "ignorar"];

type Deps = {
  prisma: PrismaClient;
  fetchCloverItemStock: (id: string) => Promise<number | null>;
  isCloverConfigured: () => boolean;
};

async function loadDeps(): Promise<Deps> {
  const [{ prisma }, clover] = await Promise.all([
    import("../src/lib/db"),
    import("../src/lib/clover"),
  ]);
  return {
    prisma,
    fetchCloverItemStock: clover.fetchCloverItemStock,
    isCloverConfigured: clover.isCloverConfigured,
  };
}

async function publishReadyProducts(prisma: PrismaClient) {
  const result = await prisma.$executeRaw`
    UPDATE "Product" p
    SET published = true
    FROM "CloverImportCandidate" c
    WHERE p."cloverItemId" = c."cloverItemId"
      AND c."cloverCategoryName" IS NOT NULL
      AND c.status = 'created'
      AND p.published = false
  `;
  return Number(result);
}

async function backfillStock(deps: Deps) {
  if (!deps.isCloverConfigured()) {
    console.warn("⚠ Clover credentials missing — skipping stock backfill.");
    return { updated: 0, skipped: true as const };
  }

  const products = await deps.prisma.product.findMany({
    where: { cloverItemId: { not: null } },
    select: { id: true, cloverItemId: true, stockQty: true },
  });

  let updated = 0;
  for (let i = 0; i < products.length; i++) {
    const p = products[i];
    if (!p.cloverItemId) continue;
    try {
      const qty = await deps.fetchCloverItemStock(p.cloverItemId);
      if (qty != null && qty !== p.stockQty) {
        await deps.prisma.product.update({
          where: { id: p.id },
          data: { stockQty: Math.max(0, qty) },
        });
        updated++;
      }
      if (qty != null) {
        await deps.prisma.cloverImportCandidate.updateMany({
          where: { cloverItemId: p.cloverItemId },
          data: { stockCount: qty },
        });
      }
    } catch {
      /* skip */
    }
    if ((i + 1) % 50 === 0) console.log(`  stock: ${i + 1}/${products.length}`);
  }
  return { updated, total: products.length, skipped: false as const };
}

function addDropdown(
  sheet: ExcelJS.Worksheet,
  colLetter: string,
  rowStart: number,
  rowEnd: number,
  listCol: string,
  listLen: number,
) {
  for (let row = rowStart; row <= rowEnd; row++) {
    sheet.getCell(`${colLetter}${row}`).dataValidation = {
      type: "list",
      allowBlank: true,
      formulae: [`Lists!$${listCol}$1:$${listCol}$${listLen}`],
      showErrorMessage: true,
      errorTitle: "Valor inválido",
      error: "Elige una opción de la lista.",
    };
  }
}

type TriageRow = {
  cloverItemId: string;
  name: string;
  priceCAD: string;
  stockCount: string;
  suggestedClover: string;
  suggestedSite: string;
  suggestedTipo: string;
  confidence: string;
  reason: string;
};

async function buildTriageRows(
  prisma: PrismaClient,
  filter: "pending_null_cat" | "created_null_cat",
): Promise<TriageRow[]> {
  const candidates = await prisma.cloverImportCandidate.findMany({
    where: {
      cloverCategoryName: null,
      status: filter === "pending_null_cat" ? "pending" : "created",
    },
    orderBy: { name: "asc" },
  });

  return candidates.map((item) => {
    const c = classifyItem({ name: item.name, cloverCategoryName: null });
    return {
      cloverItemId: item.cloverItemId,
      name: item.name,
      priceCAD: Number(item.priceCAD).toFixed(2),
      stockCount: item.stockCount != null ? String(item.stockCount) : "",
      suggestedClover: c.suggestedCloverCategory,
      suggestedSite: c.suggestedSiteCategory,
      suggestedTipo: c.recordType,
      confidence: c.confidence,
      reason: c.reason,
    };
  });
}

async function exportTriageXlsx(prisma: PrismaClient) {
  mkdirSync(OUT_DIR, { recursive: true });

  const [pendingRows, reviewRows] = await Promise.all([
    buildTriageRows(prisma, "pending_null_cat"),
    buildTriageRows(prisma, "created_null_cat"),
  ]);

  const wb = new ExcelJS.Workbook();
  wb.creator = "Reptiles Concept";

  const lists = wb.addWorksheet("Lists", { state: "veryHidden" });
  CLOVER_DROPDOWN.forEach((v, i) => {
    lists.getCell(`A${i + 1}`).value = v;
  });
  SITE_DROPDOWN.forEach((v, i) => {
    lists.getCell(`B${i + 1}`).value = v;
  });
  TIPO_DROPDOWN.forEach((v, i) => {
    lists.getCell(`C${i + 1}`).value = v;
  });

  const headers = [
    "cloverItemId",
    "name",
    "priceCAD",
    "stockCount",
    "sugerencia_clover",
    "sugerencia_sitio",
    "sugerencia_tipo",
    "confidence",
    "→ ELEGIR categoria Clover",
    "→ ELEGIR categoria sitio",
    "→ ELEGIR tipo",
    "notas",
  ];

  function fillSheet(name: string, rows: TriageRow[]) {
    const ws = wb.addWorksheet(name);
    ws.addRow(headers);
    ws.getRow(1).font = { bold: true };
    ws.views = [{ state: "frozen", ySplit: 1 }];

    for (const r of rows) {
      ws.addRow([
        r.cloverItemId,
        r.name,
        r.priceCAD,
        r.stockCount,
        r.suggestedClover,
        r.suggestedSite,
        r.suggestedTipo,
        r.confidence,
        "",
        "",
        "",
        "",
      ]);
    }

    ws.getColumn("A").width = 16;
    ws.getColumn("B").width = 48;
    ws.getColumn("I").width = 28;
    ws.getColumn("J").width = 22;
    ws.getColumn("K").width = 16;
    ws.getColumn("L").width = 30;

    if (rows.length > 0) {
      const last = rows.length + 1;
      addDropdown(ws, "I", 2, last, "A", CLOVER_DROPDOWN.length);
      addDropdown(ws, "J", 2, last, "B", SITE_DROPDOWN.length);
      addDropdown(ws, "K", 2, last, "C", TIPO_DROPDOWN.length);
    }
  }

  fillSheet(`Clover sin categoría (${pendingRows.length})`, pendingRows);
  fillSheet(`Productos a revisar (${reviewRows.length})`, reviewRows);

  const readme = wb.addWorksheet("LEER PRIMERO");
  readme.addRow(["Hoja", "Qué hacer"]);
  readme.addRow(["Clover sin categoría", "Items en Clover sin categoría — elige columnas I, J, K"]);
  readme.addRow(["Productos a revisar", "Ya en sitio sin cat. Clover — reclasificar"]);
  readme.addRow([]);
  readme.addRow(["Columnas dropdown:"]);
  readme.addRow(["→ ELEGIR categoria Clover", "Asignar en Clover POS"]);
  readme.addRow(["→ ELEGIR categoria sitio", "terrarium, decor, food_packaged, etc."]);
  readme.addRow(["→ ELEGIR tipo", "product | animal | ignorar"]);
  readme.getColumn(1).width = 28;
  readme.getColumn(2).width = 60;

  await wb.xlsx.writeFile(XLSX_PATH);
  return { path: XLSX_PATH, pending: pendingRows.length, review: reviewRows.length };
}

async function main() {
  const deps = await loadDeps();

  console.log("1/3 Publishing products with valid Clover category…");
  const published = await publishReadyProducts(deps.prisma);
  console.log(`  → ${published} products published`);

  console.log("2/3 Backfilling stock from Clover…");
  const stock = await backfillStock(deps);
  console.log(stock);

  console.log("3/3 Exporting triage XLSX with dropdowns…");
  const xlsx = await exportTriageXlsx(deps.prisma);
  console.log(xlsx);

  const totals = await deps.prisma.product.groupBy({
    by: ["published"],
    _count: { _all: true },
  });
  console.log("\nProduct publish status:", totals);

  await deps.prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
