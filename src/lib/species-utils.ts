import type { Species } from "@/generated/prisma/client";

export const EXPERIENCE_LEVELS = ["beginner", "intermediate", "advanced"] as const;
export type ExperienceLevel = (typeof EXPERIENCE_LEVELS)[number];

export interface SpeciesFormFields {
  commonNameFr?: string;
  commonNameEn?: string;
  experienceLevel?: ExperienceLevel;
  descriptionFr?: string;
  descriptionEn?: string;
  adultSizeFr?: string;
  adultSizeEn?: string;
  lifespanFr?: string;
  lifespanEn?: string;
  temperamentFr?: string;
  temperamentEn?: string;
  dietFr?: string;
  dietEn?: string;
  humidity?: string;
  tempDay?: string;
  tempNight?: string;
  uvbNeeds?: string;
  enclosureMinSize?: string;
  substrate?: string;
  feedingFrequency?: string;
  handlingFr?: string;
  handlingEn?: string;
}

/** Species care-sheet fields worth chasing down via the ChatGPT helper. */
const CARE_SHEET_KEYS: (keyof SpeciesFormFields)[] = [
  "descriptionEn",
  "humidity",
  "adultSizeEn",
];

export function isCareSheetIncomplete(species?: Pick<Species, "descriptionEn" | "humidity" | "adultSizeEn"> | null) {
  if (!species) return true;
  return CARE_SHEET_KEYS.some((key) => !species[key as keyof typeof species]);
}
