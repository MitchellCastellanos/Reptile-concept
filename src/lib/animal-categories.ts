// Single source of truth for the Animal browse taxonomy — mirrors
// product-categories.ts. Values match the `NavCategories` i18n keys 1:1,
// and the prefix before the underscore ("reptiles"/"amphibians") is the
// top-level group used to section the nav menu.
export const ANIMAL_CATEGORIES = [
  "reptiles_snakes",
  "reptiles_lizards",
  "reptiles_turtles",
  "reptiles_other",
  "amphibians_frogs",
  "amphibians_salamanders",
  "amphibians_other",
] as const;

export type AnimalCategoryValue = (typeof ANIMAL_CATEGORIES)[number];

export function isAnimalCategory(value: string | undefined): value is AnimalCategoryValue {
  return !!value && (ANIMAL_CATEGORIES as readonly string[]).includes(value);
}

export type AnimalCategoryGroupKey = "reptiles" | "amphibians";

export function animalCategoryGroup(category: AnimalCategoryValue): AnimalCategoryGroupKey {
  return category.startsWith("reptiles") ? "reptiles" : "amphibians";
}
