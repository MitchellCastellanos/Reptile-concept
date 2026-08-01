/**
 * Export XLSX with ONLY Clover items that have no category assigned.
 * Run: npm run export:uncategorized
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
const XLSX_PATH = join(OUT_DIR, "solo-sin-categoria.xlsx");

const CLOVER_DROPDOWN = [...EXISTING_CLOVER_CATEGORIES];
const SITE_DROPDOWN = [...PRODUCT_CATEGORIES];
const TIPO_DROPDOWN = ["product", "animal", "ignorar"];

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

async function main() {
  const { prisma } = await import("../src/lib/db");

  const candidates = await prisma.cloverImportCandidate.findMany({
    where: { cloverCategoryName: null },
    orderBy: [{ status: "asc" }, { name: "asc" }],
  });

  mkdirSync(OUT_DIR, { recursive: true });

  const wb = new ExcelJS.Workbook();
  wb.creator = "Reptile Concept";

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
    "queue_status",
    "sugerencia_clover",
    "sugerencia_sitio",
    "sugerencia_tipo",
    "confidence",
    "reason",
    "→ ELEGIR categoria Clover",
    "→ ELEGIR categoria sitio",
    "→ ELEGIR tipo",
    "notas",
  ];

  const ws = wb.addWorksheet(`Sin categoría (${candidates.length})`);
  ws.addRow(headers);
  ws.getRow(1).font = { bold: true };
  ws.views = [{ state: "frozen", ySplit: 1 }];

  for (const item of candidates) {
    const c = classifyItem({ name: item.name, cloverCategoryName: null });
    ws.addRow([
      item.cloverItemId,
      item.name,
      Number(item.priceCAD).toFixed(2),
      item.stockCount != null ? String(item.stockCount) : "",
      item.status,
      c.suggestedCloverCategory,
      c.suggestedSiteCategory,
      c.recordType,
      c.confidence,
      c.reason,
      "",
      "",
      "",
      "",
    ]);
  }

  ws.getColumn("A").width = 16;
  ws.getColumn("B").width = 50;
  ws.getColumn("E").width = 14;
  ws.getColumn("K").width = 28;
  ws.getColumn("L").width = 22;
  ws.getColumn("M").width = 14;
  ws.getColumn("N").width = 30;

  if (candidates.length > 0) {
    const last = candidates.length + 1;
    addDropdown(ws, "K", 2, last, "A", CLOVER_DROPDOWN.length);
    addDropdown(ws, "L", 2, last, "B", SITE_DROPDOWN.length);
    addDropdown(ws, "M", 2, last, "C", TIPO_DROPDOWN.length);
  }

  const ref = wb.addWorksheet("Referencia");
  ref.addRow(["Categorías Clover válidas (NO inventar nuevas)"]);
  EXISTING_CLOVER_CATEGORIES.forEach((c) => ref.addRow([c]));
  ref.addRow([]);
  ref.addRow(["Categorías sitio (solo si tipo = product)"]);
  PRODUCT_CATEGORIES.forEach((c) => ref.addRow([c]));
  ref.addRow([]);
  ref.addRow(["Tipo", "Significado"]);
  ref.addRow(["product", "Mercancía para la boutique en línea"]);
  ref.addRow(["animal", "Animal vivo → pipeline /animals, NO boutique"]);
  ref.addRow(["ignorar", "Certificados, frais, servicios — no publicar"]);
  ref.getColumn(1).width = 40;

  await wb.xlsx.writeFile(XLSX_PATH);

  const byStatus = candidates.reduce(
    (acc, c) => {
      acc[c.status] = (acc[c.status] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>,
  );

  console.log({ path: XLSX_PATH, total: candidates.length, byStatus });
  await prisma.$disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
