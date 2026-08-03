/**
 * Validate filled species batch Excel(s).
 * Run: npm run inventory:validate-species-batch
 */
import { existsSync, readdirSync } from "node:fs";
import { join, extname } from "node:path";
import ExcelJS from "exceljs";
import { FILL_HEADERS } from "./species-batch-shared";

const IN_DIR = join(process.cwd(), "exports", "species-batch-in");

function cellStr(value: ExcelJS.CellValue): string {
  if (value == null) return "";
  if (typeof value === "object" && "richText" in value) {
    return value.richText.map((r) => r.text).join("");
  }
  return String(value).trim();
}

async function validateFile(path: string) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(path);
  const ws = wb.getWorksheet("Espèces") ?? wb.worksheets[0];

  const headers: string[] = [];
  ws.getRow(1).eachCell({ includeEmpty: true }, (c, i) => {
    headers[i] = cellStr(c.value);
  });
  const col = (name: string) => headers.findIndex((h) => h === name);

  const required = ["commonNameFr", "commonNameEn", "descriptionEn", "humidity", "adultSizeEn", "experienceLevel"];
  const optionalFill = FILL_HEADERS.filter((h) => !required.includes(h));

  let total = 0;
  let complete = 0;
  const incomplete: { row: number; sci: string; gaps: string[] }[] = [];

  for (let r = 2; r <= ws.rowCount; r++) {
    const sci = cellStr(ws.getRow(r).getCell(col("scientificName")).value);
    if (!sci) continue;
    total++;

    const gaps = [
      ...required.filter((f) => !cellStr(ws.getRow(r).getCell(col(f)).value)),
      ...optionalFill.filter((f) => !cellStr(ws.getRow(r).getCell(col(f)).value)),
    ];

    const missingRequired = required.filter((f) => !cellStr(ws.getRow(r).getCell(col(f)).value));
    if (missingRequired.length === 0) complete++;
    if (missingRequired.length > 0) {
      incomplete.push({ row: r, sci, gaps: missingRequired });
    }
  }

  const optionalMissing = total - complete;
  console.log(`\n${path}`);
  console.log(`  species: ${total}`);
  console.log(`  required fields OK: ${complete}/${total}`);
  if (incomplete.length) {
    console.log(`  incomplete (required): ${incomplete.length}`);
    incomplete.slice(0, 5).forEach((m) => console.log(`    row ${m.row} ${m.sci} → ${m.gaps.join(", ")}`));
  } else {
    console.log(`  ✓ all required fields filled`);
  }

  const expCol = col("experienceLevel");
  let badExp = 0;
  for (let r = 2; r <= ws.rowCount; r++) {
    const sci = cellStr(ws.getRow(r).getCell(col("scientificName")).value);
    if (!sci) continue;
    const exp = cellStr(ws.getRow(r).getCell(expCol).value).toLowerCase();
    if (exp && !["beginner", "intermediate", "advanced"].includes(exp)) badExp++;
  }
  if (badExp) console.log(`  ⚠ invalid experienceLevel: ${badExp}`);

  return { total, complete, incomplete: incomplete.length };
}

async function main() {
  const arg = process.argv[2];
  const files = arg
    ? [join(process.cwd(), arg)]
    : readdirSync(IN_DIR)
        .filter((f) => extname(f).toLowerCase() === ".xlsx" && !f.startsWith("~$"))
        .map((f) => join(IN_DIR, f));

  if (!files.length || files.some((f) => !existsSync(f))) {
    console.error("No xlsx files in exports/species-batch-in/");
    process.exit(1);
  }

  let ok = true;
  for (const f of files.sort()) {
    const r = await validateFile(f);
    if (r.incomplete > 0) ok = false;
  }
  process.exit(ok ? 0 : 1);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
