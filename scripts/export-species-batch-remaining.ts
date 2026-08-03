/**
 * Re-split remaining batch Excel files into smaller chunks for ChatGPT.
 *
 * Run: npm run export:species-batch-remaining -- --chunk-size 35
 *      npm run export:species-batch-remaining -- --chunk-size 35 --files 2,3
 */
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import ExcelJS from "exceljs";
import type { SpeciesCandidate } from "../src/lib/species-candidates";
import { writeSpeciesWorkbook, buildPromptMarkdown } from "./species-batch-shared";

const OUT_DIR = join(process.cwd(), "exports", "species-batch-out");
const OUT_PROMPT = join(process.cwd(), "exports", "PROMPT-species-batch.md");

function cellStr(value: ExcelJS.CellValue): string {
  if (value == null) return "";
  if (typeof value === "object" && "richText" in value) {
    return value.richText.map((r) => r.text).join("");
  }
  return String(value).trim();
}

function parseFlag(argv: string[], flag: string, defaultVal?: number) {
  const i = argv.indexOf(flag);
  if (i === -1) return defaultVal;
  const n = Number(argv[i + 1]);
  return Number.isFinite(n) && n > 0 ? n : defaultVal;
}

function parseFiles(argv: string[]) {
  const i = argv.indexOf("--files");
  if (i === -1) return [2, 3];
  return argv[i + 1].split(",").map((n) => Number(n.trim())).filter((n) => n >= 1);
}

async function readWorkbookCandidates(path: string): Promise<SpeciesCandidate[]> {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(path);
  const ws = wb.getWorksheet("Espèces") ?? wb.worksheets[0];
  const headers: string[] = [];
  ws.getRow(1).eachCell({ includeEmpty: true }, (c, i) => {
    headers[i] = cellStr(c.value);
  });
  const col = (name: string) => headers.findIndex((h) => h === name);

  const out: SpeciesCandidate[] = [];
  for (let r = 2; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const scientificName = cellStr(row.getCell(col("scientificName")).value);
    if (!scientificName) continue;
    const category = cellStr(row.getCell(col("category")).value) as SpeciesCandidate["category"];
    const animalCount = Number(cellStr(row.getCell(col("animalCount")).value)) || 1;
    const examples = cellStr(row.getCell(col("exampleNames")).value);
    const notes = cellStr(row.getCell(col("notes")).value);
    out.push({
      scientificName,
      category,
      animalCount,
      exampleNames: examples ? examples.split("|").map((s) => s.trim()) : [],
      source: notes.includes("commercial") ? "common" : "scientific",
    });
  }
  return out;
}

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < arr.length; i += size) {
    chunks.push(arr.slice(i, i + size));
  }
  return chunks;
}

async function main() {
  const argv = process.argv.slice(2);
  const chunkSize = parseFlag(argv, "--chunk-size", 35)!;
  const fileNums = parseFiles(argv);
  const startPart = parseFlag(argv, "--start-part", 2) ?? 2;

  mkdirSync(OUT_DIR, { recursive: true });

  const allCandidates: SpeciesCandidate[] = [];
  for (const n of fileNums) {
    const path = join(OUT_DIR, `species-batch-${n}-of-3.xlsx`);
    if (!existsSync(path)) {
      console.warn(`Skip missing ${path}`);
      continue;
    }
    const c = await readWorkbookCandidates(path);
    console.log(`Loaded ${c.length} from species-batch-${n}-of-3.xlsx`);
    allCandidates.push(...c);
  }

  if (!allCandidates.length) {
    throw new Error("No candidates loaded. Check exports/species-batch-out/");
  }

  const chunks = chunkArray(allCandidates, chunkSize);
  const totalParts = startPart - 1 + chunks.length;

  for (let i = 0; i < chunks.length; i++) {
    const partNum = startPart + i;
    const filename = `species-batch-${partNum}-of-${totalParts}.xlsx`;
    const outPath = join(OUT_DIR, filename);
    await writeSpeciesWorkbook(
      chunks[i],
      outPath,
      `Partie ${partNum} / ${totalParts} — ${chunks[i].length} espèces (~${chunkSize} max)`,
    );
    console.log(`Wrote ${filename} (${chunks[i].length} species)`);
  }

  writeFileSync(
    join(OUT_DIR, "README-remaining.md"),
    `# Lots restants (${chunks.length} fichiers × ~${chunkSize} espèces)

Batch 1 déjà fait → \`species-batch-in/species-batch-1-of-3-filled.xlsx\`

| Fichier à envoyer à ChatGPT | Espèces |
|-------------|---------|
${chunks.map((c, i) => `| \`species-batch-${startPart + i}-of-${totalParts}.xlsx\` | ${c.length} |`).join("\n")}
| **Total restant** | **${allCandidates.length}** |

Même prompt: \`exports/PROMPT-species-batch.md\`

Déposer les fichiers remplis dans \`exports/species-batch-in/\` (même nom, ou suffixe \`-filled\`).
`,
    "utf8",
  );

  writeFileSync(
    OUT_PROMPT,
    buildPromptMarkdown(`species-batch-N-of-${totalParts}.xlsx (~${chunkSize} espèces max)`, chunkSize),
    "utf8",
  );

  console.log(`\nTotal remaining: ${allCandidates.length} species → ${chunks.length} files`);
  console.log(`Prompt updated: ${OUT_PROMPT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
