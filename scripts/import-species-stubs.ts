/**
 * One-time import of multi-species ChatGPT stub fill (PROMPT-species-stubs.md format).
 *
 * Run: npm run inventory:import-species-stubs -- path/to/response.txt
 *      npm run inventory:import-species-stubs   (reads exports/species-stubs-response.txt)
 */
import { config } from "dotenv";
config({ path: ".env.local" });
config();

import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { prisma } from "../src/lib/db";
import { parseSpeciesChatGptResponse } from "../src/lib/species-chatgpt-prompt";
import { normalizeScientificNameKey } from "../src/lib/species-candidates";

/** Block order must match PROMPT-species-stubs.md (11 entries). */
const BLOCK_STUB_KEYS = [
  "couple",
  "jumping spider",
  "leachieanus bb",
  "madagascar spiny",
  "mante religieuse",
  "marginated tortoise",
  "p. spinicornis 15+",
  "pool mix color",
  "thamnophis cyrtopsis ocellatus",
  "tinctorius yellow",
  "tliltocatl kahlenbetgi",
] as const;

const CATEGORY_FIX: Record<string, string> = {
  "porcellio spinicornis": "invertebrates_other",
};

function buildUpdateData(
  canonical: string,
  fields: ReturnType<typeof parseSpeciesChatGptResponse>,
  categoryFix?: string,
) {
  return {
    scientificName: canonical,
    commonNameFr: fields.commonNameFr!,
    commonNameEn: fields.commonNameEn!,
    experienceLevel: fields.experienceLevel ?? undefined,
    descriptionFr: fields.descriptionFr,
    descriptionEn: fields.descriptionEn,
    adultSizeFr: fields.adultSizeFr,
    adultSizeEn: fields.adultSizeEn,
    lifespanFr: fields.lifespanFr,
    lifespanEn: fields.lifespanEn,
    temperamentFr: fields.temperamentFr,
    temperamentEn: fields.temperamentEn,
    dietFr: fields.dietFr,
    dietEn: fields.dietEn,
    humidity: fields.humidity,
    tempDay: fields.tempDay,
    tempNight: fields.tempNight,
    uvbNeeds: fields.uvbNeeds,
    enclosureMinSize: fields.enclosureMinSize,
    substrate: fields.substrate,
    feedingFrequency: fields.feedingFrequency,
    handlingFr: fields.handlingFr,
    handlingEn: fields.handlingEn,
    ...(categoryFix ? { category: categoryFix as never } : {}),
  };
}

function parseBlocks(raw: string) {
  return raw
    .split(/---NEXT_SPECIES---/i)
    .map((s) => s.trim())
    .filter(Boolean);
}

function speciesLine(block: string): string | null {
  const m = block.match(/^SPECIES:\s*(.+)$/im);
  return m?.[1].trim() ?? null;
}

async function main() {
  const arg = process.argv[2];
  const path = arg
    ? join(process.cwd(), arg)
    : join(process.cwd(), "exports", "species-stubs-response.txt");

  if (!existsSync(path)) {
    console.error(`File not found: ${path}`);
    console.error("Save ChatGPT response as exports/species-stubs-response.txt");
    process.exit(1);
  }

  const raw = readFileSync(path, "utf8");
  const blocks = parseBlocks(raw);
  console.log(`Found ${blocks.length} species blocks`);

  const stubs = await prisma.species.findMany({
    where: {
      id: { not: { startsWith: "clover-species-" } },
      OR: [{ descriptionEn: null }, { descriptionEn: "" }],
    },
    select: { id: true, scientificName: true, category: true },
  });

  const stubByKey = new Map(
    stubs.map((s) => [normalizeScientificNameKey(s.scientificName), s]),
  );

  let updated = 0;
  let skipped = 0;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const canonical = speciesLine(block);
    const fields = parseSpeciesChatGptResponse(block);
    if (!canonical || !fields.commonNameFr || !fields.commonNameEn) {
      skipped++;
      continue;
    }

    const stubKey = BLOCK_STUB_KEYS[i];
    const target = stubKey
      ? stubByKey.get(normalizeScientificNameKey(stubKey))
      : undefined;

    if (!target) {
      console.warn(`No stub match for block ${i + 1} (${canonical})`);
      skipped++;
      continue;
    }

    const categoryFix = CATEGORY_FIX[normalizeScientificNameKey(canonical)];

    await prisma.species.update({
      where: { id: target.id },
      data: buildUpdateData(canonical, fields, categoryFix),
    });
    console.log(`Updated [${i + 1}]: ${target.scientificName} → ${canonical}`);
    updated++;
  }

  console.log(`\nDone: ${updated} updated, ${skipped} skipped`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
