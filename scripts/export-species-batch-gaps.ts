/**
 * Export unfilled rows from a partial ChatGPT fill + optional new source files.
 *
 * Run: npm run export:species-batch-gaps -- --filled exports/species-batch-in/species-batch-1-of-3-filled.xlsx --source exports/species-batch-out/species-batch-1-of-3.xlsx --chunk-size 35
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import ExcelJS from "exceljs";
import type { SpeciesCandidate } from "../src/lib/species-candidates";
import { writeSpeciesWorkbook } from "./species-batch-shared";

function cellStr(value: ExcelJS.CellValue): string {
  if (value == null) return "";
  if (typeof value === "object" && "richText" in value) {
    return value.richText.map((r) => r.text).join("");
  }
  return String(value).trim();
}

function parseArg(argv: string[], flag: string) {
  const i = argv.indexOf(flag);
  return i === -1 ? undefined : argv[i + 1];
}

function parseFlag(argv: string[], flag: string, defaultVal: number) {
  const v = parseArg(argv, flag);
  if (!v) return defaultVal;
  const n = Number(v);
  return Number.isFinite(n) && n > 0 ? n : defaultVal;
}

async function readCandidates(path: string): Promise<Map<string, SpeciesCandidate>> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(path);
  const ws = wb.getWorksheet("Espèces") ?? wb.worksheets[0];
  const headers: string[] = [];
  ws.getRow(1).eachCell({ includeEmpty: true }, (c, i) => {
    headers[i] = cellStr(c.value);
  });
  const col = (name: string) => headers.findIndex((h) => h === name);

  const map = new Map<string, SpeciesCandidate>();
  for (let r = 2; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const scientificName = cellStr(row.getCell(col("scientificName")).value);
    if (!scientificName) continue;
    const key = scientificName.toLowerCase();
    map.set(key, {
      scientificName,
      category: cellStr(row.getCell(col("category")).value) as SpeciesCandidate["category"],
      animalCount: Number(cellStr(row.getCell(col("animalCount")).value)) || 1,
      exampleNames: cellStr(row.getCell(col("exampleNames")).value)
        .split("|")
        .map((s) => s.trim())
        .filter(Boolean),
      source: "scientific",
    });
  }
  return map;
}

async function filledKeys(path: string): Promise<Set<string>> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(path);
  const ws = wb.getWorksheet("Espèces") ?? wb.worksheets[0];
  const headers: string[] = [];
  ws.getRow(1).eachCell({ includeEmpty: true }, (c, i) => {
    headers[i] = cellStr(c.value);
  });
  const col = (name: string) => headers.findIndex((h) => h === name);
  const required = ["commonNameFr", "commonNameEn", "descriptionEn"];

  const done = new Set<string>();
  for (let r = 2; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const sci = cellStr(row.getCell(col("scientificName")).value);
    if (!sci) continue;
    const ok = required.every((f) => cellStr(row.getCell(col(f)).value));
    if (ok) done.add(sci.toLowerCase());
  }
  return done;
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size));
  return chunks;
}

async function main() {
  const argv = process.argv.slice(2);
  const filled = parseArg(argv, "--filled");
  const source = parseArg(argv, "--source");
  const chunkSize = parseFlag(argv, "--chunk-size", 35);
  const prefix = parseArg(argv, "--prefix") ?? "species-batch-gap";

  if (!filled || !source) {
    console.error("Usage: --filled <filled.xlsx> --source <original.xlsx> [--chunk-size 35]");
    process.exit(1);
  }

  const filledPath = join(process.cwd(), filled);
  const sourcePath = join(process.cwd(), source);
  if (!existsSync(filledPath) || !existsSync(sourcePath)) {
    throw new Error("filled or source file not found");
  }

  const [sourceMap, done] = await Promise.all([readCandidates(sourcePath), filledKeys(filledPath)]);
  const gaps = [...sourceMap.values()].filter((c) => !done.has(c.scientificName.toLowerCase()));

  console.log(`Source: ${sourceMap.size}, filled: ${done.size}, gaps: ${gaps.length}`);

  const outDir = join(process.cwd(), "exports", "species-batch-out");
  mkdirSync(outDir, { recursive: true });
  const chunks = chunkArray(gaps, chunkSize);

  for (let i = 0; i < chunks.length; i++) {
    const filename = `${prefix}-${i + 1}-of-${chunks.length}.xlsx`;
    await writeSpeciesWorkbook(chunks[i], join(outDir, filename), `Gaps ${i + 1}/${chunks.length}`);
    console.log(`Wrote ${filename} (${chunks[i].length})`);
  }

  writeFileSync(
    join(outDir, "README-gaps.md"),
    `# Filas faltantes del batch 1 (${gaps.length} espèces)

Ya llenadas en \`species-batch-1-of-3-filled.xlsx\`: **${done.size}**

| Archivo | Espèces |
|---------|---------|
${chunks.map((c, i) => `| \`${prefix}-${i + 1}-of-${chunks.length}.xlsx\` | ${c.length} |`).join("\n")}
`,
    "utf8",
  );
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
