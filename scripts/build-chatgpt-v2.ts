/**
 * Build chatgpt-v2.xlsx: auto-fill K/L/M from suggestions (high/medium),
 * leave low/review rows empty for manual AI completion.
 *
 * Run: npm run export:chatgpt-v2
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config();

import { copyFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import ExcelJS from "exceljs";
import { EXISTING_CLOVER_CATEGORIES } from "./inventory-classifier";
import { PRODUCT_CATEGORIES } from "../src/lib/product-categories";

const OUT_DIR = join(process.cwd(), "exports");
const SOURCE = join(OUT_DIR, "solo-sin-categoria.xlsx");
const FALLBACK = join(OUT_DIR, "chatgpt.xlsx");
const OUT = join(OUT_DIR, "chatgpt-v2.xlsx");

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

function cellStr(row: ExcelJS.Row, col: number): string {
  return String(row.getCell(col).value ?? "").trim();
}

async function main() {
  const source = existsSync(SOURCE) ? SOURCE : FALLBACK;
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(source);

  const ws =
    wb.worksheets.find((s) => s.name.startsWith("Sin categor")) ??
    wb.worksheets.find((s) => s.rowCount > 10)!;

  const headers: string[] = [];
  ws.getRow(1).eachCell({ includeEmpty: true }, (c, i) => {
    headers[i] = String(c.value ?? "");
  });

  const col = (name: string) => headers.findIndex((h) => h === name);
  const colIncludes = (part: string) => headers.findIndex((h) => h?.includes(part));

  const iConf = col("confidence");
  const iSugClover = col("sugerencia_clover");
  const iSugSite = col("sugerencia_sitio");
  const iSugTipo = col("sugerencia_tipo");
  const iK = colIncludes("ELEGIR categoria Clover");
  const iL = colIncludes("ELEGIR categoria sitio");
  const iM = colIncludes("ELEGIR tipo");
  const iNotas = col("notas");

  if ([iK, iL, iM, iConf].some((i) => i < 1)) {
    throw new Error("Columnas esperadas no encontradas en el Excel fuente.");
  }

  // Fix Lists sheet for dropdowns
  let lists = wb.getWorksheet("Lists");
  if (!lists) lists = wb.addWorksheet("Lists", { state: "veryHidden" });
  lists.spliceRows(1, lists.rowCount);
  CLOVER_DROPDOWN.forEach((v, i) => {
    lists!.getCell(`A${i + 1}`).value = v;
  });
  SITE_DROPDOWN.forEach((v, i) => {
    lists!.getCell(`B${i + 1}`).value = v;
  });
  TIPO_DROPDOWN.forEach((v, i) => {
    lists!.getCell(`C${i + 1}`).value = v;
  });

  let autoFilled = 0;
  let leftEmpty = 0;
  const emptyRows: number[] = [];

  for (let r = 2; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const id = row.getCell(col("cloverItemId") || 1).value;
    if (!id) continue;

    const conf = cellStr(row, iConf);
    const sugClover = cellStr(row, iSugClover);
    const sugSite = cellStr(row, iSugSite);
    const sugTipo = cellStr(row, iSugTipo);

    const canAutoFill =
      (conf === "high" || conf === "medium") &&
      sugClover &&
      sugTipo &&
      sugTipo !== "review" &&
      (sugTipo !== "product" || !!sugSite);

    if (canAutoFill) {
      row.getCell(iK).value = sugClover;
      row.getCell(iL).value = sugTipo === "product" ? sugSite : "";
      row.getCell(iM).value = sugTipo;
      row.getCell(iNotas).value = conf === "medium" ? "auto-v2: revisar sugerencia medium" : "";
      autoFilled++;
    } else {
      row.getCell(iK).value = "";
      row.getCell(iL).value = "";
      row.getCell(iM).value = "";
      row.getCell(iNotas).value = "";
      leftEmpty++;
      emptyRows.push(r);
    }
  }

  const dataRows = autoFilled + leftEmpty;
  if (dataRows > 0) {
    addDropdown(ws, "K", 2, dataRows + 1, "A", CLOVER_DROPDOWN.length);
    addDropdown(ws, "L", 2, dataRows + 1, "B", SITE_DROPDOWN.length);
    addDropdown(ws, "M", 2, dataRows + 1, "C", TIPO_DROPDOWN.length);
  }

  // Instructions sheet for humans / ChatGPT
  let instr = wb.getWorksheet("INSTRUCCIONES");
  if (!instr) instr = wb.addWorksheet("INSTRUCCIONES");
  instr.spliceRows(1, instr.rowCount);
  instr.addRow(["chatgpt-v2.xlsx"]);
  instr.addRow([]);
  instr.addRow(["Filas auto-rellenadas (K/L/M):", autoFilled]);
  instr.addRow(["Filas vacías para completar:", leftEmpty]);
  instr.addRow([]);
  instr.addRow(["Solo llenar filas donde K está vacío."]);
  instr.addRow(["Columnas editables: K, L, M, N únicamente."]);
  instr.getColumn(1).width = 36;
  instr.getColumn(2).width = 20;

  ws.name = `Sin categoría (${dataRows})`;

  await wb.xlsx.writeFile(OUT);

  console.log({
    source,
    out: OUT,
    autoFilled,
    leftEmpty,
    total: dataRows,
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
