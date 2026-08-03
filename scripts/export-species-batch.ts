/**
 * Build species-batch Excel(s) from inventory.
 *
 * Run: npm run export:species-batch
 *      npm run export:species-batch -- --csv
 *      npm run export:species-batch -- --split 3 --csv
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config();

import { mkdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { join } from "node:path";
import { prisma } from "../src/lib/db";
import { groupSpeciesCandidates } from "../src/lib/species-candidates";
import { classifyItem } from "./inventory-classifier";
import {
  buildPromptMarkdown,
  splitCandidates,
  writeSpeciesWorkbook,
} from "./species-batch-shared";

const OUT_DIR = join(process.cwd(), "exports");
const OUT_XLSX = join(OUT_DIR, "species-batch.xlsx");
const OUT_PROMPT = join(OUT_DIR, "PROMPT-species-batch.md");
const OUT_SPLIT_DIR = join(OUT_DIR, "species-batch-out");
const IN_DIR = join(OUT_DIR, "species-batch-in");
const CSV_FALLBACK = join(OUT_DIR, "inventaire-complet.csv");

function parseFlag(argv: string[], flag: string) {
  const i = argv.indexOf(flag);
  if (i === -1) return undefined;
  const n = Number(argv[i + 1]);
  return Number.isFinite(n) && n > 0 ? n : undefined;
}

function parseCsvLine(line: string) {
  const cols: string[] = [];
  let cur = "";
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const c = line[i];
    if (inQ) {
      if (c === '"' && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else if (c === '"') inQ = false;
      else cur += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") {
      cols.push(cur);
      cur = "";
    } else cur += c;
  }
  cols.push(cur);
  return cols;
}

function loadItemsFromCsv() {
  if (!existsSync(CSV_FALLBACK)) {
    throw new Error(`No DB and no CSV at ${CSV_FALLBACK}. Run npm run export:inventory-master first.`);
  }
  const csv = readFileSync(CSV_FALLBACK, "utf8");
  const lines = csv.split(/\r?\n/).filter(Boolean);
  const headers = parseCsvLine(lines[0]);
  const idx = Object.fromEntries(headers.map((h, i) => [h, i]));
  const items: { name: string; cloverCategoryName?: string | null }[] = [];

  for (const line of lines.slice(1)) {
    const row = parseCsvLine(line);
    if (row[idx.recordType] !== "animal") continue;
    items.push({
      name: row[idx.name],
      cloverCategoryName: row[idx.cloverCategory] || null,
    });
  }
  console.log(`Loaded ${items.length} animal rows from ${CSV_FALLBACK}`);
  return items;
}

async function loadItemsFromDb() {
  const [animals, pending] = await Promise.all([
    prisma.animal.findMany({ select: { morph: true, cloverItemId: true } }),
    prisma.cloverImportCandidate.findMany({
      where: { status: "pending" },
      select: { name: true, cloverCategoryName: true },
    }),
  ]);

  const createdMeta = await prisma.cloverImportCandidate.findMany({
    where: { status: "created" },
    select: { cloverItemId: true, cloverCategoryName: true },
  });
  const cloverCatById = new Map(createdMeta.map((c) => [c.cloverItemId, c.cloverCategoryName ?? ""]));

  const items: { name: string; cloverCategoryName?: string | null }[] = [];

  for (const a of animals) {
    items.push({
      name: a.morph,
      cloverCategoryName: a.cloverItemId ? cloverCatById.get(a.cloverItemId) : null,
    });
  }

  for (const p of pending) {
    const c = classifyItem({ name: p.name, cloverCategoryName: p.cloverCategoryName });
    if (c.recordType === "animal") {
      items.push({ name: p.name, cloverCategoryName: p.cloverCategoryName });
    }
  }

  return items;
}

async function main() {
  const argv = process.argv.slice(2);
  const limit = parseFlag(argv, "--limit");
  const split = parseFlag(argv, "--split") ?? 1;
  const forceCsv = argv.includes("--csv");

  mkdirSync(OUT_DIR, { recursive: true });
  mkdirSync(IN_DIR, { recursive: true });

  let items: { name: string; cloverCategoryName?: string | null }[];
  if (forceCsv) {
    items = loadItemsFromCsv();
  } else {
    try {
      items = await loadItemsFromDb();
    } catch {
      console.warn("DB unavailable — falling back to inventaire-complet.csv");
      items = loadItemsFromCsv();
    }
  }

  let candidates = groupSpeciesCandidates(items);
  if (limit) candidates = candidates.slice(0, limit);

  if (split <= 1) {
    await writeSpeciesWorkbook(candidates, OUT_XLSX);
    writeFileSync(OUT_PROMPT, buildPromptMarkdown("exports/species-batch.xlsx", candidates.length), "utf8");
    console.log(`Wrote ${OUT_XLSX} (${candidates.length} species)`);
  } else {
    mkdirSync(OUT_SPLIT_DIR, { recursive: true });
    const chunks = splitCandidates(candidates, split);

    for (let i = 0; i < chunks.length; i++) {
      const part = i + 1;
      const filename = `species-batch-${part}-of-${chunks.length}.xlsx`;
      const outPath = join(OUT_SPLIT_DIR, filename);
      await writeSpeciesWorkbook(
        chunks[i],
        outPath,
        `Partie ${part} / ${chunks.length} — ${chunks[i].length} espèces`,
      );
      console.log(`Wrote ${outPath} (${chunks[i].length} species)`);
    }

    writeFileSync(
      OUT_PROMPT,
      buildPromptMarkdown("exports/species-batch-out/species-batch-N-of-M.xlsx", 0).replace(
        "(0 espèces)",
        "(usa el conteo de tu archivo)",
      ),
      "utf8",
    );

    writeFileSync(
      join(OUT_SPLIT_DIR, "README.md"),
      `# Excel à envoyer à ChatGPT (${chunks.length} fichiers)

| Fichier | Espèces |
|---------|---------|
${chunks.map((c, i) => `| \`species-batch-${i + 1}-of-${chunks.length}.xlsx\` | ${c.length} |`).join("\n")}
| **Total** | **${candidates.length}** |

## Étapes

1. Ouvre **un fichier à la fois** dans ChatGPT Premium
2. Copie le prompt depuis \`exports/PROMPT-species-batch.md\` (même prompt pour les ${chunks.length})
3. Télécharge le .xlsx rempli dans \`exports/species-batch-in/\` **en gardant le même nom**
4. Quand les ${chunks.length} sont là → \`npm run inventory:import-species-batch\`
`,
      "utf8",
    );
  }

  writeFileSync(
    join(IN_DIR, "README.md"),
    `# Fichiers remplis par ChatGPT — déposer ici

Place les .xlsx **remplis** avec le **même nom** que dans \`species-batch-out/\`:

\`\`\`
species-batch-1-of-3.xlsx
species-batch-2-of-3.xlsx
species-batch-3-of-3.xlsx
\`\`\`

Puis: \`npm run inventory:import-species-batch\`
`,
    "utf8",
  );

  console.log(`Wrote ${OUT_PROMPT}`);
  console.log(`Drop filled files in ${IN_DIR}`);
  console.log(`Top 5: ${candidates.slice(0, 5).map((c) => `${c.scientificName} (${c.animalCount})`).join(", ")}`);
}

main()
  .catch((err) => {
    console.error(err);
    process.exit(1);
  })
  .finally(async () => {
    try {
      await prisma.$disconnect();
    } catch {
      /* DB may never have connected */
    }
  });
