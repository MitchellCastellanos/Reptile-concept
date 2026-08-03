// Best-effort category inference from a listing title / Clover name — used when
// auto-importing animals and for one-time reclassification of placeholder species.
import type { AnimalCategoryValue } from "@/lib/animal-categories";

type Rule = { pattern: RegExp; category: AnimalCategoryValue };

const RULES: Rule[] = [
  { pattern: /\b(gecko|gargouille|correlophus|eublepharis|rhacodactylus)\b/i, category: "reptiles_geckos" },
  {
    pattern: /\b(python|boa|serpent|snake|corn|ball python|royal|kingsnake|milksnake|rat snake|hognose)\b/i,
    category: "reptiles_snakes",
  },
  { pattern: /\b(tortue|turtle|tortoise|testudo|geochelone|chelydra)\b/i, category: "reptiles_turtles" },
  { pattern: /\b(axolotl|salamander|salamandre|newt|triton)\b/i, category: "amphibians_salamanders" },
  { pattern: /\b(frog|grenouille|crapaud|toad|dendrobates|phyllomedusa)\b/i, category: "amphibians_frogs" },
  {
    pattern: /\b(tarantula|araignée|araignee|spider|scorpion|tliltocatl|acanthoscurria|phonopelma|brachypelma)\b/i,
    category: "invertebrates_arachnids",
  },
  { pattern: /\b(mantis|mante|stick insect|phasmid|beetle|coléoptère|coleoptere)\b/i, category: "invertebrates_insects" },
  {
    pattern: /\b(chameleon|caméléon|cameleon|pogona|dragon barbu|bearded|tegu|monitors?|varan|iguana|iguane|skink|scinc|anolis|uromastyx|lézard|lezard|lizard)\b/i,
    category: "reptiles_lizards",
  },
  { pattern: /\b(amphibien|amphibian|caecilian|nécrophore)\b/i, category: "amphibians_other" },
  { pattern: /\b(snail|escargot|millipede|mille-pattes|centipede|scolopendra)\b/i, category: "invertebrates_other" },
];

/** Clover category → coarse default before morph refinement. */
const CLOVER_CATEGORY_DEFAULT: Record<string, AnimalCategoryValue> = {
  serpent: "reptiles_snakes",
  lezard: "reptiles_lizards",
  lézard: "reptiles_lizards",
  tortue: "reptiles_turtles",
  amphibien: "amphibians_other",
};

export function inferAnimalCategoryFromMorph(
  morph: string,
  cloverCategoryName?: string | null,
): AnimalCategoryValue {
  for (const { pattern, category } of RULES) {
    if (pattern.test(morph)) return category;
  }
  const key = cloverCategoryName?.trim().toLowerCase() ?? "";
  if (CLOVER_CATEGORY_DEFAULT[key]) return CLOVER_CATEGORY_DEFAULT[key];
  return "reptiles_other";
}
