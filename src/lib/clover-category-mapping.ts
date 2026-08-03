// Best-effort helpers for mapping a Clover category name onto the site's
// ProductCategory or Animal pipeline — informed by the client's real Clover
// catalog (~1800 items across ~16 categories).
import type { ProductCategoryValue } from "@/lib/product-categories";

export type CloverImportRoute =
  | { kind: "animal" }
  | { kind: "auto_product"; productCategory: ProductCategoryValue; published?: boolean }
  | { kind: "manual" };

// Live pets sold individually (Serpent, Lezard, …). Rongeur and isopods are
// NOT here — rodents are feeder inventory; isopods are bioactive cleanup crew
// sold like crickets (see resolveCloverImportRoute).
const ANIMAL_CATEGORY_KEYWORDS = [
  "serpent",
  "lezard",
  "lézard",
  "gecko",
  "amphibien",
  "grenouille",
  "tortue",
];

// Clover's "Isopod et Araignee et Fourmis" bucket is mixed: isopod colonies
// and springtails are live merchandise; tarantulas/spiders are pet animals.
const ISOPOD_LIVE_FOOD_NAME =
  /\b(isopod|isopods|oniscus|porcellio|porcellionides|cubaris|trichoniscus|nesodillo|pruinosus|collembole|springtail|party mix|dwarf white|dairy cow|t\. tomentosa|leavis|scaber koi|scaber lava|scaber orange|scaber calico|haasi light|soil''|cappuccino|glacier|jelly bean|feeder \(50|feeder \(qty|qty15|qty 12|qty 50)/i;

const PET_ARACHNID_NAME =
  /\b(araignée|araignee|spider|tarantula|tliltocatl|acanthoscurria|mante religieuse|jumping spider)/i;

const FROZEN_FEEDER_NAME =
  /\b(lapin|cochon d'inde|cochon d.ind|frozen|congel|rats colossal|poussin poulet)/i;

const PACKAGED_FEEDER_NAME =
  /\b(mazuri|rat chow|rat & mouse|hamster et gerbil|nourriture isopod|ant nectar|pierre décorative|pierre decorative)/i;

const MIXED_CATEGORY_MERCH = [
  { pattern: /\b(tarantula crib|plastic plant|plante grasse)\b/i, category: "decor" as const },
  { pattern: /\b(nourriture isopod)\b/i, category: "food_packaged" as const },
  { pattern: /\b(ant nectar)\b/i, category: "supplement" as const },
];

function normalizeCategory(cloverCategoryName: string | null): string {
  return cloverCategoryName?.trim().toLowerCase() ?? "";
}

function isMixedInvertebrateCategory(cat: string): boolean {
  return cat.includes("isopod") || cat.includes("araignee") || cat.includes("araignée") || cat.includes("fourmis");
}

function productCategoryForRongeurItem(name: string): ProductCategoryValue {
  if (FROZEN_FEEDER_NAME.test(name)) return "food_frozen";
  if (PACKAGED_FEEDER_NAME.test(name)) return "food_packaged";
  return "food_live";
}

function productCategoryForMixedInvertebrateItem(name: string): ProductCategoryValue | null {
  for (const { pattern, category } of MIXED_CATEGORY_MERCH) {
    if (pattern.test(name)) return category;
  }
  if (ISOPOD_LIVE_FOOD_NAME.test(name)) return "food_live";
  return null;
}

/** Where a new Clover item should land before staff review. */
export function resolveCloverImportRoute(
  cloverCategoryName: string | null,
  itemName: string,
): CloverImportRoute {
  const cat = normalizeCategory(cloverCategoryName);
  const name = itemName.trim();

  if (cat === "rongeur") {
    return {
      kind: "auto_product",
      productCategory: productCategoryForRongeurItem(name),
      published: true,
    };
  }

  if (isMixedInvertebrateCategory(cat)) {
    const merch = productCategoryForMixedInvertebrateItem(name);
    if (merch) {
      return { kind: "auto_product", productCategory: merch, published: true };
    }
    if (PET_ARACHNID_NAME.test(name)) {
      return { kind: "animal" };
    }
    // Ant colonies, misc — queue unless name clearly isopod-ish
    if (/\b(fourmis|ant colony|colonie)\b/i.test(name)) {
      return { kind: "manual" };
    }
    return { kind: "manual" };
  }

  if (cat === "insecte vivant") {
    return { kind: "auto_product", productCategory: "food_live", published: true };
  }

  if (ANIMAL_CATEGORY_KEYWORDS.some((kw) => cat.includes(kw))) {
    return { kind: "animal" };
  }

  return { kind: "manual" };
}

/** True when the Clover category (or item name in a mixed bucket) is a live pet. */
export function looksLikeAnimalCategory(
  cloverCategoryName: string | null,
  itemName?: string,
): boolean {
  return resolveCloverImportRoute(cloverCategoryName, itemName ?? "").kind === "animal";
}

/** True when staff should bulk-create Products, not Animals. */
export function looksLikeLiveFoodCategory(cloverCategoryName: string | null): boolean {
  const cat = normalizeCategory(cloverCategoryName);
  return cat === "rongeur" || cat === "insecte vivant";
}

/** True for Clover's mixed isopod/spider/ant bucket (needs per-item routing). */
export function isMixedInvertebrateCloverCategory(cloverCategoryName: string | null): boolean {
  return isMixedInvertebrateCategory(normalizeCategory(cloverCategoryName));
}

// Exact Clover category names (lowercased) seen in the client's real
// catalog, mapped to the closest site category — pre-fills the select in admin.
const SUGGESTIONS: Record<string, ProductCategoryValue> = {
  habitat: "terrarium",
  substrat: "substrate",
  decoration: "decor",
  "roche et bois/cork": "decor",
  "plante vivant": "decor",
  lumiere: "lighting",
  "piece remplacement/ electronique": "equipment",
  "insecte vivant": "food_live",
  rongeur: "food_live",
  nourriture: "food_packaged",
  supplement: "supplement",
};

export function suggestProductCategory(cloverCategoryName: string | null): ProductCategoryValue | undefined {
  if (!cloverCategoryName) return undefined;
  return SUGGESTIONS[cloverCategoryName.trim().toLowerCase()];
}
