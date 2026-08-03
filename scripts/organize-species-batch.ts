/**
 * Extract completed species from partial fill + reorganize out/ for remaining work.
 *
 * Run: npm run inventory:organize-species-batch
 */
import {
  existsSync,
  mkdirSync,
  readdirSync,
  renameSync,
  writeFileSync,
  copyFileSync,
  unlinkSync,
} from "node:fs";
import { join } from "node:path";
import ExcelJS from "exceljs";
import { FILL_HEADERS, INPUT_HEADERS } from "./species-batch-shared";

const ROOT = join(process.cwd(), "exports");
const IN_DIR = join(ROOT, "species-batch-in");
const OUT_DIR = join(ROOT, "species-batch-out");
const DONE_DIR = join(ROOT, "species-batch-done");
const ARCHIVE_DIR = join(OUT_DIR, "_archive");

const FILLED = join(IN_DIR, "species-batch-1-of-3-filled.xlsx");
const SOURCE_BATCH1 = join(OUT_DIR, "species-batch-1-of-3.xlsx");

/** Pending files in processing order (source names in out/). */
const PENDING_SOURCES = [
  "species-batch-1-gap-1-of-4.xlsx",
  "species-batch-1-gap-2-of-4.xlsx",
  "species-batch-1-gap-3-of-4.xlsx",
  "species-batch-1-gap-4-of-4.xlsx",
  "species-batch-2-of-10.xlsx",
  "species-batch-3-of-10.xlsx",
  "species-batch-4-of-10.xlsx",
  "species-batch-5-of-10.xlsx",
  "species-batch-6-of-10.xlsx",
  "species-batch-7-of-10.xlsx",
  "species-batch-8-of-10.xlsx",
  "species-batch-9-of-10.xlsx",
  "species-batch-10-of-10.xlsx",
];

function cellStr(value: ExcelJS.CellValue): string {
  if (value == null) return "";
  if (typeof value === "object" && "richText" in value) {
    return value.richText.map((r) => r.text).join("");
  }
  return String(value).trim();
}

function isRowComplete(row: ExcelJS.Row, col: (n: string) => number): boolean {
  const required = ["commonNameFr", "commonNameEn", "descriptionEn"];
  const sci = cellStr(row.getCell(col("scientificName")).value);
  if (!sci) return false;
  return required.every((f) => cellStr(row.getCell(col(f)).value));
}

async function extractCompleted() {
  if (!existsSync(FILLED)) {
    console.warn(`No filled file at ${FILLED} — skip extract`);
    return 0;
  }

  mkdirSync(DONE_DIR, { recursive: true });

  const src = new ExcelJS.Workbook();
  await src.xlsx.readFile(FILLED);
  const srcWs = src.getWorksheet("Espèces") ?? src.worksheets[0];

  const headers: string[] = [];
  srcWs.getRow(1).eachCell({ includeEmpty: true }, (c, i) => {
    headers[i] = cellStr(c.value);
  });
  const col = (name: string) => headers.findIndex((h) => h === name);
  const allHeaders = headers.filter((h) => h);

  const dst = new ExcelJS.Workbook();
  dst.creator = "Reptile Concept";
  const dstWs = dst.addWorksheet("Espèces");
  dstWs.addRow(allHeaders);
  dstWs.getRow(1).font = { bold: true };

  let count = 0;
  const names: string[] = [];
  for (let r = 2; r <= srcWs.rowCount; r++) {
    const row = srcWs.getRow(r);
    if (!isRowComplete(row, col)) continue;
    const values = allHeaders.map((_, i) => cellStr(row.getCell(i + 1).value));
    dstWs.addRow(values);
    names.push(cellStr(row.getCell(col("scientificName")).value));
    count++;
  }

  const donePath = join(DONE_DIR, "batch-1-completed.xlsx");
  await dst.xlsx.writeFile(donePath);
  copyFileSync(FILLED, join(DONE_DIR, "batch-1-filled-original.xlsx"));

  try {
    unlinkSync(FILLED);
    console.log("Removed partial fill from species-batch-in/ (archived in done/)");
  } catch {
    /* ok */
  }

  writeFileSync(
    join(DONE_DIR, "README.md"),
    `# Espèces complétées (${count})

Extrait de \`species-batch-in/species-batch-1-of-3-filled.xlsx\`.

| Fichier | Usage |
|---------|--------|
| \`batch-1-completed.xlsx\` | ${count} espèces prêtes pour import |
| \`batch-1-filled-original.xlsx\` | Copie archive du fichier ChatGPT |

Import avec les autres: \`npm run inventory:import-species-batch\` (lit aussi \`species-batch-done/\`).

## Espèces (${count})

${names.map((n) => `- ${n}`).join("\n")}
`,
    "utf8",
  );

  console.log(`Extracted ${count} completed → ${donePath}`);
  return count;
}

function reorganizeOut() {
  mkdirSync(ARCHIVE_DIR, { recursive: true });

  for (const old of ["species-batch-1-of-3.xlsx", "species-batch-2-of-3.xlsx", "species-batch-3-of-3.xlsx"]) {
    const p = join(OUT_DIR, old);
    if (existsSync(p)) {
      renameSync(p, join(ARCHIVE_DIR, old));
      console.log(`Archived ${old}`);
    }
  }

  // Remove old gap / of-10 names after we rename to todo-*
  const total = PENDING_SOURCES.length;

  for (let i = 0; i < PENDING_SOURCES.length; i++) {
    const src = join(OUT_DIR, PENDING_SOURCES[i]);
    const todoName = `species-batch-todo-${String(i + 1).padStart(2, "0")}-of-${String(total).padStart(2, "0")}.xlsx`;
    const dest = join(OUT_DIR, todoName);

    if (!existsSync(src)) {
      console.warn(`Missing pending file: ${PENDING_SOURCES[i]}`);
      continue;
    }

    if (existsSync(dest) && src !== dest) {
      renameSync(dest, join(ARCHIVE_DIR, todoName + ".bak"));
    }
    renameSync(src, dest);
    console.log(`${PENDING_SOURCES[i]} → ${todoName}`);
  }

  // Archive any leftover xlsx in out that isn't todo-*
  for (const f of readdirSync(OUT_DIR)) {
    if (!f.endsWith(".xlsx")) continue;
    if (f.startsWith("species-batch-todo-")) continue;
    renameSync(join(OUT_DIR, f), join(ARCHIVE_DIR, f));
    console.log(`Archived leftover ${f}`);
  }

  writeFileSync(
    join(OUT_DIR, "README.md"),
    `# Excel à envoyer à ChatGPT (${total} fichiers)

**${total} fichiers restants** × ~35 espèces. Même prompt: \`exports/PROMPT-species-batch.md\`

Les **38 espèces déjà complétées** du batch 1 sont dans \`exports/species-batch-done/\`.

## Ordre

| # | Fichier | Notes |
|---|---------|--------|
${PENDING_SOURCES.map((_, i) => {
  const n = i + 1;
  const note =
    n <= 4 ? "Batch 1 — manquant" : n <= 13 ? "Batches 2+3 originaux" : "";
  return `| ${n} | \`species-batch-todo-${String(n).padStart(2, "0")}-of-${String(total).padStart(2, "0")}.xlsx\` | ${note} |`;
}).join("\n")}

## Après ChatGPT

1. Dépose chaque .xlsx rempli dans \`exports/species-batch-in/\` (même nom \`todo-XX\` ou suffixe \`-filled\`)
2. Aviser Mitch → validation + import
`,
    "utf8",
  );
}

async function main() {
  const completed = await extractCompleted();
  reorganizeOut();

  writeFileSync(
    join(IN_DIR, "README.md"),
    `# Fichiers remplis par ChatGPT

Dépose ici chaque Excel **rempli** depuis \`species-batch-out/species-batch-todo-XX-of-13.xlsx\`.

## Déjà fait (batch 1 partiel)

**${completed} espèces** extraites → \`exports/species-batch-done/batch-1-completed.xlsx\`

L'original ChatGPT est archivé dans \`species-batch-done/batch-1-filled-original.xlsx\`.

## Reste à faire

13 fichiers dans \`species-batch-out/\` (todo-01 … todo-13).
`,
    "utf8",
  );

  console.log("\nDone. Send ChatGPT files from exports/species-batch-out/species-batch-todo-*.xlsx");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
