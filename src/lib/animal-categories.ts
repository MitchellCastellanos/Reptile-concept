// Single source of truth for the Animal browse taxonomy — mirrors
// product-categories.ts. Values match the `NavCategories` i18n keys 1:1.
export const ANIMAL_CATEGORIES = [
  "reptiles_snakes",
  "reptiles_geckos",
  "reptiles_lizards",
  "reptiles_turtles",
  "reptiles_other",
  "amphibians_frogs",
  "amphibians_salamanders",
  "amphibians_other",
  "invertebrates_arachnids",
  "invertebrates_insects",
  "invertebrates_other",
] as const;

export type AnimalCategoryValue = (typeof ANIMAL_CATEGORIES)[number];

export type AnimalCategoryGroupKey = "reptiles" | "amphibians" | "invertebrates";

/** Top-level nav / pill sections in display order. */
export const ANIMAL_CATEGORY_GROUPS: {
  key: AnimalCategoryGroupKey;
  categories: AnimalCategoryValue[];
}[] = [
  {
    key: "reptiles",
    categories: [
      "reptiles_snakes",
      "reptiles_geckos",
      "reptiles_lizards",
      "reptiles_turtles",
      "reptiles_other",
    ],
  },
  {
    key: "amphibians",
    categories: ["amphibians_frogs", "amphibians_salamanders", "amphibians_other"],
  },
  {
    key: "invertebrates",
    categories: ["invertebrates_arachnids", "invertebrates_insects", "invertebrates_other"],
  },
];

export function isAnimalCategory(value: string | undefined): value is AnimalCategoryValue {
  return !!value && (ANIMAL_CATEGORIES as readonly string[]).includes(value);
}

export function isAnimalCategoryGroup(value: string | undefined): value is AnimalCategoryGroupKey {
  return !!value && ANIMAL_CATEGORY_GROUPS.some((group) => group.key === value);
}

export function animalCategoriesInGroup(group: AnimalCategoryGroupKey): AnimalCategoryValue[] {
  return ANIMAL_CATEGORY_GROUPS.find((g) => g.key === group)!.categories;
}

export function animalCategoryGroup(category: AnimalCategoryValue): AnimalCategoryGroupKey {
  if (category.startsWith("reptiles")) return "reptiles";
  if (category.startsWith("amphibians")) return "amphibians";
  return "invertebrates";
}

/** Flat icon shown on the subcategory buttons (/animals grouped grid). */
export const ANIMAL_CATEGORY_ICON: Record<AnimalCategoryValue, string> = {
  reptiles_snakes: "/images/icons/subcategory-reptiles-snakes.png",
  reptiles_geckos: "/images/icons/subcategory-reptiles-geckos.png",
  reptiles_lizards: "/images/icons/subcategory-reptiles-lizards.png",
  reptiles_turtles: "/images/icons/subcategory-reptiles-turtles.png",
  reptiles_other: "/images/icons/subcategory-reptiles-other.png",
  amphibians_frogs: "/images/icons/subcategory-amphibians-frogs.png",
  amphibians_salamanders: "/images/icons/subcategory-amphibians-salamanders.png",
  amphibians_other: "/images/icons/subcategory-amphibians-other.png",
  invertebrates_arachnids: "/images/icons/subcategory-invertebrates-arachnids.png",
  invertebrates_insects: "/images/icons/subcategory-invertebrates-insects.png",
  invertebrates_other: "/images/icons/subcategory-invertebrates-other.png",
};

/** Default Clover placeholder Species id per browse category. */
export const CLOVER_SPECIES_ID_BY_CATEGORY: Record<AnimalCategoryValue, string> = {
  reptiles_snakes: "clover-species-serpent",
  reptiles_geckos: "clover-species-gecko",
  reptiles_lizards: "clover-species-lezard",
  reptiles_turtles: "clover-species-tortue",
  reptiles_other: "clover-species-generic",
  amphibians_frogs: "clover-species-amphibien",
  amphibians_salamanders: "clover-species-amphibien",
  amphibians_other: "clover-species-amphibien",
  invertebrates_arachnids: "clover-species-arachnide",
  invertebrates_insects: "clover-species-insect",
  invertebrates_other: "clover-species-invertebrate",
};
