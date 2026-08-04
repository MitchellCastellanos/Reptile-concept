// Auto-create Animal records from Clover inventory items whose category is
// a live-animal bucket (Serpent, Lezard, Tortue, etc.). Uses placeholder
// Species per browse subcategory; morph keywords refine geckos, arachnids, etc.
import { prisma } from "@/lib/db";
import {
  CLOVER_SPECIES_ID_BY_CATEGORY,
  type AnimalCategoryValue,
} from "@/lib/animal-categories";
import { inferAnimalCategoryFromMorph } from "@/lib/animal-category-inference";
import { looksLikeAnimalCategory } from "@/lib/clover-category-mapping";
import { shouldSkipAnimalName } from "@/lib/species-candidates";

const PET_ARACHNID_NAME =
  /\b(araignée|araignee|spider|tarantula|tliltocatl|acanthoscurria|mante religieuse|jumping spider)/i;

const SPECIES_META: Record<
  string,
  { category: AnimalCategoryValue; commonNameFr: string; commonNameEn: string; scientificName: string }
> = {
  "clover-species-serpent": {
    category: "reptiles_snakes",
    commonNameFr: "Serpent",
    commonNameEn: "Snake",
    scientificName: "Serpentes sp.",
  },
  "clover-species-gecko": {
    category: "reptiles_geckos",
    commonNameFr: "Gecko",
    commonNameEn: "Gecko",
    scientificName: "Gekkota sp.",
  },
  "clover-species-lezard": {
    category: "reptiles_lizards",
    commonNameFr: "Lézard",
    commonNameEn: "Lizard",
    scientificName: "Sauria sp.",
  },
  "clover-species-tortue": {
    category: "reptiles_turtles",
    commonNameFr: "Tortue",
    commonNameEn: "Turtle",
    scientificName: "Testudines sp.",
  },
  "clover-species-amphibien": {
    category: "amphibians_other",
    commonNameFr: "Amphibien",
    commonNameEn: "Amphibian",
    scientificName: "Amphibia sp.",
  },
  "clover-species-arachnide": {
    category: "invertebrates_arachnids",
    commonNameFr: "Arachnide",
    commonNameEn: "Arachnid",
    scientificName: "Arachnida sp.",
  },
  "clover-species-insect": {
    category: "invertebrates_insects",
    commonNameFr: "Insecte",
    commonNameEn: "Insect",
    scientificName: "Insecta sp.",
  },
  "clover-species-invertebrate": {
    category: "invertebrates_other",
    commonNameFr: "Invertébré",
    commonNameEn: "Invertebrate",
    scientificName: "Invertebrata sp.",
  },
  "clover-species-generic": {
    category: "reptiles_other",
    commonNameFr: "Reptile",
    commonNameEn: "Reptile",
    scientificName: "Reptilia sp.",
  },
};

function parseSex(name: string): "male" | "female" | "unknown" {
  const lower = name.toLowerCase();
  if (/\b(male|♂| m\b| m\.| m,)\b/.test(lower)) return "male";
  if (/\b(female|femelle|fem\.|♀| f\b| f\.| f,)\b/.test(lower)) return "female";
  return "unknown";
}

async function ensureSpecies(speciesId: string): Promise<void> {
  const meta = SPECIES_META[speciesId];
  if (!meta) return;
  await prisma.species.upsert({
    where: { id: speciesId },
    create: {
      id: speciesId,
      commonNameFr: meta.commonNameFr,
      commonNameEn: meta.commonNameEn,
      scientificName: meta.scientificName,
      category: meta.category,
    },
    update: { category: meta.category },
  });
}

function resolveCategory(cloverCategoryName: string | null, itemName: string): AnimalCategoryValue | null {
  if (shouldSkipAnimalName(itemName)) return null;
  if (itemName && PET_ARACHNID_NAME.test(itemName)) {
    return "invertebrates_arachnids";
  }
  if (!looksLikeAnimalCategory(cloverCategoryName, itemName)) return null;
  return inferAnimalCategoryFromMorph(itemName, cloverCategoryName);
}

export async function createAnimalFromCloverData(params: {
  cloverItemId: string;
  name: string;
  priceCAD: number;
  stockCount?: number | null;
  cloverCategoryName: string | null;
}): Promise<boolean> {
  const category = resolveCategory(params.cloverCategoryName, params.name);
  if (!category) return false;

  const speciesId = CLOVER_SPECIES_ID_BY_CATEGORY[category];
  await ensureSpecies(speciesId);

  const status = (params.stockCount ?? 0) > 0 ? "available" : "sold";

  try {
    await prisma.animal.create({
      data: {
        speciesId,
        morph: params.name,
        sex: parseSex(params.name),
        priceCAD: params.priceCAD,
        status,
        descriptionFr: params.name,
        descriptionEn: params.name,
        cloverItemId: params.cloverItemId,
      },
    });
    return true;
  } catch (err) {
    console.error(`[clover-animal-import] failed for Clover item ${params.cloverItemId}:`, err);
    return false;
  }
}
