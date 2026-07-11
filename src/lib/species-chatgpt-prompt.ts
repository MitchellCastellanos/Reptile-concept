import type { SpeciesFormFields } from "@/lib/species-utils";
import { EXPERIENCE_LEVELS } from "@/lib/species-utils";

/**
 * Manual copy → ChatGPT → paste → parse helper.
 *
 * There is no OpenAI/AI API call here: buildSpeciesChatGptPrompt() produces a prompt
 * the admin copies into ChatGPT by hand, and parseSpeciesChatGptResponse() reads back
 * whatever labeled text they paste. The "protocol" between the two is the label list
 * below (contract by labels, not JSON) so it survives an admin lightly editing the reply.
 */

const LABEL_ORDER = [
  "COMMON_EN",
  "COMMON_FR",
  "EXPERIENCE",
  "DESCRIPTION_EN",
  "DESCRIPTION_FR",
  "ADULT_SIZE_EN",
  "ADULT_SIZE_FR",
  "LIFESPAN_EN",
  "LIFESPAN_FR",
  "TEMPERAMENT_EN",
  "TEMPERAMENT_FR",
  "DIET_EN",
  "DIET_FR",
  "HUMIDITY",
  "TEMP_DAY",
  "TEMP_NIGHT",
  "UVB_NEEDS",
  "ENCLOSURE_MIN_SIZE",
  "SUBSTRATE",
  "FEEDING_FREQUENCY",
  "HANDLING_EN",
  "HANDLING_FR",
] as const;

type Label = (typeof LABEL_ORDER)[number];

const FIELD_MAP: Record<Label, keyof SpeciesFormFields> = {
  COMMON_EN: "commonNameEn",
  COMMON_FR: "commonNameFr",
  EXPERIENCE: "experienceLevel",
  DESCRIPTION_EN: "descriptionEn",
  DESCRIPTION_FR: "descriptionFr",
  ADULT_SIZE_EN: "adultSizeEn",
  ADULT_SIZE_FR: "adultSizeFr",
  LIFESPAN_EN: "lifespanEn",
  LIFESPAN_FR: "lifespanFr",
  TEMPERAMENT_EN: "temperamentEn",
  TEMPERAMENT_FR: "temperamentFr",
  DIET_EN: "dietEn",
  DIET_FR: "dietFr",
  HUMIDITY: "humidity",
  TEMP_DAY: "tempDay",
  TEMP_NIGHT: "tempNight",
  UVB_NEEDS: "uvbNeeds",
  ENCLOSURE_MIN_SIZE: "enclosureMinSize",
  SUBSTRATE: "substrate",
  FEEDING_FREQUENCY: "feedingFrequency",
  HANDLING_EN: "handlingEn",
  HANDLING_FR: "handlingFr",
};

function normalizeLabel(raw: string): string {
  return raw
    .replace(/\*/g, "")
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, "_");
}

const LABEL_BY_NORMALIZED = new Map<string, Label>(
  LABEL_ORDER.map((label) => [normalizeLabel(label), label]),
);

export function buildSpeciesChatGptPrompt({
  scientificName,
  notes,
}: {
  scientificName: string;
  notes?: string;
}): string {
  const trimmedNotes = notes?.trim();

  return `You are a bilingual (English/French) reptile-keeping hobbyist writing care-sheet copy for a reptile shop's product catalog.

Species (scientific name): ${scientificName}
${trimmedNotes ? `Extra context from the admin: ${trimmedNotes}\n` : ""}
Reply with ONLY the block below, one "LABEL: value" per line, no markdown, no extra commentary, no code fences. Keep each value plain text (a few sentences max for descriptions). For EXPERIENCE use exactly one of: beginner, intermediate, advanced. If a value can't legitimately span multiple lines, keep it to one line; multi-line values are only expected for the two DESCRIPTION fields.

COMMON_EN:
COMMON_FR:
EXPERIENCE:
DESCRIPTION_EN:
DESCRIPTION_FR:
ADULT_SIZE_EN:
ADULT_SIZE_FR:
LIFESPAN_EN:
LIFESPAN_FR:
TEMPERAMENT_EN:
TEMPERAMENT_FR:
DIET_EN:
DIET_FR:
HUMIDITY:
TEMP_DAY:
TEMP_NIGHT:
UVB_NEEDS:
ENCLOSURE_MIN_SIZE:
SUBSTRATE:
FEEDING_FREQUENCY:
HANDLING_EN:
HANDLING_FR: `;
}

const LABEL_LINE_RE = /^\s*\**\s*([A-Za-z][A-Za-z0-9 _-]*)\**\s*:\s?(.*)$/;

export function parseSpeciesChatGptResponse(raw: string): Partial<SpeciesFormFields> {
  const result: Partial<SpeciesFormFields> = {};
  let currentKey: keyof SpeciesFormFields | null = null;

  for (const line of raw.split(/\r?\n/)) {
    const match = line.match(LABEL_LINE_RE);
    const normalized = match ? normalizeLabel(match[1]) : null;
    const label = normalized ? LABEL_BY_NORMALIZED.get(normalized) : undefined;

    if (match && label) {
      currentKey = FIELD_MAP[label];
      const value = match[2].replace(/\*/g, "").trim();
      result[currentKey] = (value || undefined) as never;
      continue;
    }

    // Not a recognized "LABEL: value" line: treat as a continuation of the
    // previous field's value (ChatGPT sometimes wraps long descriptions).
    if (currentKey && line.trim()) {
      const existing = result[currentKey];
      result[currentKey] = (existing ? `${existing}\n${line.trim()}` : line.trim()) as never;
    }
  }

  if (
    result.experienceLevel &&
    !EXPERIENCE_LEVELS.includes(result.experienceLevel as (typeof EXPERIENCE_LEVELS)[number])
  ) {
    delete result.experienceLevel;
  }

  return result;
}
