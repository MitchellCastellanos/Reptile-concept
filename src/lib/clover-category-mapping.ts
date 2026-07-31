// Best-effort helpers for mapping a Clover category name onto the site's
// ProductCategory — informed by the client's real Clover catalog (~1800
// items across ~16 categories), not a guess. Both are advisory only: staff
// still confirm/change the suggestion, and the animal-category guard just
// hides a button rather than blocking anything outright.
import type { ProductCategoryValue } from "@/lib/product-categories";

// Clover has no "this is animals, not merchandise" flag. Categories like
// "Serpent" (400+ items) or "Lezard" are live animals that need individual
// species/genetics/description entry (see "Créer un animal") — bulk-creating
// them as generic Products would flood the catalog with junk. This keyword
// match protects the bulk "Créer tout comme produits" button from ever
// being offered for those.
const ANIMAL_KEYWORDS = [
  "serpent",
  "lezard",
  "lézard",
  "gecko",
  "rongeur",
  "amphibien",
  "araignee",
  "araignée",
  "isopod",
  "fourmis",
  "tortue",
  "reptile",
  "arachnide",
  "grenouille",
];

export function looksLikeAnimalCategory(cloverCategoryName: string | null): boolean {
  if (!cloverCategoryName) return false;
  const lower = cloverCategoryName.toLowerCase();
  return ANIMAL_KEYWORDS.some((kw) => lower.includes(kw));
}

// Exact Clover category names (lowercased) seen in the client's real
// catalog, mapped to the closest site category — just pre-fills the select,
// never applied without a human confirming/submitting the form.
const SUGGESTIONS: Record<string, ProductCategoryValue> = {
  habitat: "terrarium",
  substrat: "substrate",
  decoration: "decor",
  "roche et bois/cork": "decor",
  "plante vivant": "decor",
  lumiere: "lighting",
  "piece remplacement/ electronique": "equipment",
  "insecte vivant": "food_live",
  nourriture: "food_packaged",
  supplement: "supplement",
};

export function suggestProductCategory(cloverCategoryName: string | null): ProductCategoryValue | undefined {
  if (!cloverCategoryName) return undefined;
  return SUGGESTIONS[cloverCategoryName.trim().toLowerCase()];
}
