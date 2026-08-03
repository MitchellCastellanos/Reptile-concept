/**
 * Import filled species Excel(s) into Species table.
 *
 * Run: npm run inventory:import-species-batch
 *      npm run inventory:import-species-batch -- exports/species-batch-in/
 *      npm run inventory:import-species-batch -- exports/species-batch-in/species-batch-1-of-3.xlsx
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config();

import { existsSync, readdirSync, statSync } from "node:fs";
import { join, extname } from "node:path";
import ExcelJS from "exceljs";
import { prisma } from "../src/lib/db";
import { isAnimalCategory } from "../src/lib/animal-categories";
import { normalizeScientificNameKey } from "../src/lib/species-candidates";
import { EXPERIENCE_LEVELS } from "../src/lib/species-utils";
import { FILL_HEADERS } from "./species-batch-shared";

const DEFAULT_DIR = join(process.cwd(), "exports", "species-batch-in");
const DONE_DIR = join(process.cwd(), "exports", "species-batch-done");
const DEFAULT_FILE = join(process.cwd(), "exports", "species-batch-filled.xlsx");

const FILL_FIELDS = FILL_HEADERS;

function cellStr(value: ExcelJS.CellValue): string {
  if (value == null) return "";
  if (typeof value === "object" && "richText" in value) {
    return value.richText.map((r) => r.text).join("");
  }
  return String(value).trim();
}

function optionalField(value: string) {
  return value.length > 0 ? value : null;
}

function parseExperience(value: string) {
  const v = value.toLowerCase();
  return EXPERIENCE_LEVELS.includes(v as (typeof EXPERIENCE_LEVELS)[number])
    ? (v as (typeof EXPERIENCE_LEVELS)[number])
    : null;
}

function resolveInputPaths(arg?: string): string[] {
  if (arg) {
    const p = join(process.cwd(), arg);
    if (!existsSync(p)) throw new Error(`Path not found: ${p}`);
    if (statSync(p).isDirectory()) {
      return listXlsx(p);
    }
    return [p];
  }

  const fromIn = listXlsx(DEFAULT_DIR);
  const fromDone = existsSync(DONE_DIR) ? listXlsx(DONE_DIR) : [];
  const combined = [...fromDone, ...fromIn];
  if (combined.length > 0) return combined;
  if (existsSync(DEFAULT_FILE)) return [DEFAULT_FILE];
  throw new Error(
    `No filled files in ${DEFAULT_DIR}. Drop ChatGPT output there (*.xlsx, optional -filled suffix).`,
  );
}

function listXlsx(dir: string) {
  return readdirSync(dir)
    .filter(
      (f) =>
        extname(f).toLowerCase() === ".xlsx" &&
        !f.startsWith("~$") &&
        !f.includes("filled-original") &&
        (f.includes("species-batch") || f.includes("filled") || f.includes("completed")),
    )
    .sort()
    .map((f) => join(dir, f));
}

async function importWorkbook(input: string, bySci: Map<string, { id: string; scientificName: string }>) {
  const wb = new ExcelJS.Workbook();
  await wb.xlsx.readFile(input);
  const ws = wb.getWorksheet("Espèces") ?? wb.worksheets[0];

  const headers: string[] = [];
  ws.getRow(1).eachCell({ includeEmpty: true }, (c, i) => {
    headers[i] = cellStr(c.value);
  });

  const col = (name: string) => headers.findIndex((h) => h === name);
  const sciCol = col("scientificName");
  const catCol = col("category");
  const commonFrCol = col("commonNameFr");

  if (sciCol < 1 || commonFrCol < 1) {
    throw new Error(`Expected columns scientificName and commonNameFr in ${input}`);
  }

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (let r = 2; r <= ws.rowCount; r++) {
    const row = ws.getRow(r);
    const scientificName = cellStr(row.getCell(sciCol).value);
    const commonNameFr = cellStr(row.getCell(commonFrCol).value);

    if (!scientificName || !commonNameFr) {
      skipped++;
      continue;
    }

    const categoryRaw = cellStr(row.getCell(catCol).value);
    const category = isAnimalCategory(categoryRaw) ? categoryRaw : "reptiles_other";

    const data: Record<string, string | null> = {
      commonNameFr,
      scientificName,
      category,
    };

    for (const field of FILL_FIELDS) {
      const i = col(field);
      if (i < 1) continue;
      const raw = cellStr(row.getCell(i).value);
      if (field === "experienceLevel") {
        data.experienceLevel = parseExperience(raw);
      } else if (field !== "commonNameFr") {
        data[field] = optionalField(raw);
      }
    }

    if (!data.commonNameEn) {
      skipped++;
      console.warn(`  skip row ${r}: missing commonNameEn for ${scientificName}`);
      continue;
    }

    const key = normalizeScientificNameKey(scientificName);
    const found = bySci.get(key);

    if (found) {
      await prisma.species.update({
        where: { id: found.id },
        data: data as Parameters<typeof prisma.species.update>[0]["data"],
      });
      updated++;
    } else {
      const species = await prisma.species.create({
        data: data as Parameters<typeof prisma.species.create>[0]["data"],
      });
      bySci.set(key, species);
      created++;
    }
  }

  return { created, updated, skipped };
}

async function main() {
  const inputArg = process.argv[2];
  const paths = resolveInputPaths(inputArg);

  const existing = await prisma.species.findMany({
    select: { id: true, scientificName: true },
  });
  const bySci = new Map(existing.map((s) => [normalizeScientificNameKey(s.scientificName), s]));

  let totalCreated = 0;
  let totalUpdated = 0;
  let totalSkipped = 0;

  for (const input of paths) {
    console.log(`Importing ${input}…`);
    const { created, updated, skipped } = await importWorkbook(input, bySci);
    console.log(`  created: ${created}, updated: ${updated}, skipped: ${skipped}`);
    totalCreated += created;
    totalUpdated += updated;
    totalSkipped += skipped;
  }

  console.log(`\nTotal: created ${totalCreated}, updated ${totalUpdated}, skipped ${totalSkipped}`);
  if (totalCreated + totalUpdated > 0) {
    console.log("Next: npm run inventory:link-animals-species");
  }
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
