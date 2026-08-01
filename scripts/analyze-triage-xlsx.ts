import ExcelJS from "exceljs";
import { EXISTING_CLOVER_CATEGORIES } from "./inventory-classifier";
import { PRODUCT_CATEGORIES } from "../src/lib/product-categories";

const file = process.argv[2] ?? "exports/chatgpt.xlsx";

const VALID_CLOVER = new Set<string>([...EXISTING_CLOVER_CATEGORIES]);
const VALID_SITE = new Set<string>([...PRODUCT_CATEGORIES]);
const VALID_TIPO = new Set(["product", "animal", "ignorar"]);

type Row = {
  r: number;
  id: string;
  name: string;
  status: string;
  conf: string;
  clover: string;
  site: string;
  tipo: string;
  notas: string;
  sugClover: string;
  sugSite: string;
  sugTipo: string;
};

async function loadRows(path: string): Promise<{ sheet: string; rows: Row[] }> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(path);
  const ws =
    wb.worksheets.find(
      (s) => s.rowCount > 1 && !["Lists", "Referencia", "LEER PRIMERO"].includes(s.name),
    ) ?? wb.worksheets[0];

  const headers: string[] = [];
  ws.getRow(1).eachCell({ includeEmpty: true }, (c, i) => {
    headers[i] = String(c.value ?? "");
  });

  // ChatGPT sometimes inserts a blank column A — detect offset
  let offset = 0;
  if (!headers[1]?.trim() && headers[2] === "cloverItemId") offset = 1;

  const col = (name: string) => {
    const i = headers.findIndex((h) => h === name);
    return i >= 0 ? i : -1;
  };

  const iId = col("cloverItemId");
  const iName = col("name");
  const iStatus = col("queue_status");
  const iConf = col("confidence");
  const iK = headers.findIndex((h) => h?.includes("ELEGIR categoria Clover"));
  const iL = headers.findIndex((h) => h?.includes("ELEGIR categoria sitio"));
  const iM = headers.findIndex((h) => h?.includes("ELEGIR tipo"));
  const iNotas = col("notas");
  const iSugClover = col("sugerencia_clover");
  const iSugSite = col("sugerencia_sitio");
  const iSugTipo = col("sugerencia_tipo");

  const rows: Row[] = [];
  for (let r = 2; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const id = row.getCell(iId).value;
    if (!id) continue;
    rows.push({
      r,
      id: String(id),
      name: String(row.getCell(iName).value ?? ""),
      status: String(row.getCell(iStatus).value ?? ""),
      conf: String(row.getCell(iConf).value ?? ""),
      clover: String(row.getCell(iK).value ?? "").trim(),
      site: String(row.getCell(iL).value ?? "").trim(),
      tipo: String(row.getCell(iM).value ?? "").trim(),
      notas: String(row.getCell(iNotas).value ?? "").trim(),
      sugClover: String(row.getCell(iSugClover).value ?? "").trim(),
      sugSite: String(row.getCell(iSugSite).value ?? "").trim(),
      sugTipo: String(row.getCell(iSugTipo).value ?? "").trim(),
    });
  }

  return { sheet: ws.name, rows, offset, iK, iL, iM };
}

function main() {
  loadRows(file).then(async ({ sheet, rows, offset, iK, iL, iM }) => {
    console.log("File:", file);
    console.log("Sheet:", sheet);
    console.log("Total rows:", rows.length);

    const missingK = rows.filter((x) => !x.clover);
    const missingM = rows.filter((x) => !x.tipo);
    const missingLProduct = rows.filter((x) => x.tipo === "product" && !x.site);
    const shouldEmptyL = rows.filter(
      (x) => (x.tipo === "animal" || x.tipo === "ignorar") && x.site,
    );
    const invalidClover = rows.filter((x) => x.clover && !VALID_CLOVER.has(x.clover));
    const invalidSite = rows.filter((x) => x.site && !VALID_SITE.has(x.site));
    const invalidTipo = rows.filter((x) => x.tipo && !VALID_TIPO.has(x.tipo));
    const lowConf = rows.filter((x) => x.conf === "low");
    const lowNoNotas = lowConf.filter((x) => !x.notas);

    const byTipo: Record<string, number> = {};
    const byClover: Record<string, number> = {};
    const byStatus = { pending: 0, created: 0 };
    for (const x of rows) {
      byTipo[x.tipo || "(vacío)"] = (byTipo[x.tipo || "(vacío)"] || 0) + 1;
      if (x.clover) byClover[x.clover] = (byClover[x.clover] || 0) + 1;
      if (x.status === "pending") byStatus.pending++;
      if (x.status === "created") byStatus.created++;
    }

    const filledK = rows.filter((x) => x.clover);
    const filledFromSug = rows.filter((x) => !x.clover && x.sugClover && x.sugTipo !== "review");
    const reviewRows = rows.filter((x) => x.sugTipo === "review" || x.conf === "low");
    const onlySuggestions = rows.filter((x) => !x.clover && x.sugClover);

    console.log("Índices columnas K/L/M:", iK, iL, iM);
    console.log("Columnas K/L/M llenas:", filledK.length);
    console.log("Solo tienen sugerencias F-H (sin K/L/M):", onlySuggestions.length);
    console.log("Filas review/low confidence:", reviewRows.length);
    console.log("Por tipo:", byTipo);
    console.log("Por queue_status:", byStatus);
    console.log("Sin categoría Clover (K):", missingK.length);
    console.log("Sin tipo (M):", missingM.length);
    console.log("Product sin categoría sitio (L):", missingLProduct.length);
    console.log("Animal/ignorar con L llena:", shouldEmptyL.length);
    console.log("Clover inválidos:", invalidClover.length);
    console.log("Sitio inválidos:", invalidSite.length);
    console.log("Tipo inválidos:", invalidTipo.length);
    console.log("Confidence low:", lowConf.length, "| sin notas:", lowNoNotas.length);

    console.log("\nTop categorías Clover:");
    Object.entries(byClover)
      .sort((a, b) => b[1] - a[1])
      .forEach(([k, v]) => console.log(`  ${v}\t${k}`));

    const print = (label: string, arr: Row[], n = 10) => {
      if (!arr.length) return;
      console.log(`\n${label} (${arr.length}):`);
      for (const x of arr.slice(0, n)) {
        console.log(`  fila ${x.r}: ${x.name.slice(0, 55)} | K=${x.clover} L=${x.site} M=${x.tipo}`);
      }
    };

    print("Sin K", missingK);
    print("Sin M", missingM);
    print("Product sin L", missingLProduct);
    print("Animal/ignorar con L", shouldEmptyL);
    print("Clover inválido", invalidClover);
    print("Sitio inválido", invalidSite);
    print("Tipo inválido", invalidTipo);
    print("Low confidence sin notas", lowNoNotas, 15);

    // Spot-check PT codes classified as Habitat
    const ptHabitat = rows.filter(
      (x) => /^PT\d/i.test(x.name) && x.clover === "Habitat" && x.tipo === "product",
    );
    console.log("\nPT#### marcados Habitat (revisar si son lámpara/suplemento):", ptHabitat.length);
    print("Ejemplos PT→Habitat", ptHabitat, 8);

    try {
      const ref = await loadRows("exports/solo-sin-categoria.xlsx");
      const refIds = new Set(ref.rows.map((x) => x.id));
      const curIds = new Set(rows.map((x) => x.id));
      const missingInChatgpt = ref.rows.filter((x) => !curIds.has(x.id));
      const extraInChatgpt = rows.filter((x) => !refIds.has(x.id));
      console.log("\nComparación vs solo-sin-categoria:");
      console.log("  Referencia:", ref.rows.length, "| chatgpt:", rows.length);
      console.log("  Faltan en chatgpt:", missingInChatgpt.length);
      console.log("  Extra en chatgpt:", extraInChatgpt.length);
      if (missingInChatgpt.length) print("Faltan en chatgpt", missingInChatgpt, 5);
    } catch {
      /* no ref file */
    }
  });
}

main();
