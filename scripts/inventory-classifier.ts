/**
 * Advisory classification for Clover inventory cleanup exports.
 * Does NOT mutate data — only produces suggestions for human review.
 */
import type { ProductCategoryValue } from "../src/lib/product-categories";
import { suggestProductCategory, looksLikeAnimalCategory } from "../src/lib/clover-category-mapping";

export type RecordType = "animal" | "product" | "ignore" | "review";
export type Confidence = "high" | "medium" | "low";

export type Classification = {
  recordType: RecordType;
  suggestedSiteCategory: ProductCategoryValue | "";
  suggestedCloverCategory: string;
  keepCloverCategory: boolean;
  confidence: Confidence;
  reason: string;
  cleanNameFr: string;
  brand: string;
};

// Clover categories that already exist — prefer mapping into these over inventing new ones.
const EXISTING_CLOVER_CATEGORIES = [
  "Habitat",
  "Substrat",
  "Decoration",
  "Roche Et Bois/Cork",
  "Plante Vivant",
  "Lumiere",
  "Piece Remplacement/ Electronique",
  "Insecte Vivant",
  "Nourriture",
  "Supplement",
  "Serpent",
  "Lezard",
  "Rongeur",
  "Amphibien",
  "Isopod et Araignee et Fourmis",
] as const;

// When item has NO Clover category, suggest assigning one of these (minimal new taxonomy).
const UNCategorized_TO_CLOVER: { pattern: RegExp; clover: string; site: ProductCategoryValue; confidence: Confidence }[] = [
  { pattern: /^PT\d|faunarium|exoterra|terrarium|paludarium|reptibreeze|atasuki|cage used|habitat pour|fond d'aquarium/i, clover: "Habitat", site: "terrarium", confidence: "high" },
  { pattern: /^Z99|zoomed.*terrarium|naturalistic terrarium|double door terrarium|low boy|skyscraper/i, clover: "Habitat", site: "terrarium", confidence: "high" },
  { pattern: /^DR\d|repashy|mazuri|gecko diet|beardie buffet|pineapple express|mulberry madness|cherry bomb|mango tango|vitamine|calcium plus|insectivore|omnivore|carnivorous reptile meal/i, clover: "Nourriture", site: "food_packaged", confidence: "high" },
  { pattern: /^5TNL|mazuri/i, clover: "Nourriture", site: "food_packaged", confidence: "high" },
  { pattern: /substrat|substrate|bedding|biobedding|jurassic fiber|coco husk|coco chip|sphagnum|moss|aragonite|soil|terreau|mousse tropicale|feuilles de (chêne|murier|magnolia)/i, clover: "Substrat", site: "substrate", confidence: "high" },
  { pattern: /hide|cachette|cave|hut|basking hut|branch|bois|cork|feuille|leaf|botanical|trunk|plante vivant|roche|decoration|ceramic cave|floating turtle/i, clover: "Decoration", site: "decor", confidence: "medium" },
  { pattern: /uvb|heat|bulb|lampe|lumiere|basking|ceramic heater|tapis chauffant|heat mat|nightlight|daylight|mercury vapor/i, clover: "Lumiere", site: "lighting", confidence: "high" },
  { pattern: /mist|pump|filter|thermo|hygro|timer|controller|\bsystem\b|remplacement|electronique|thermostat|humidifier|calypso misting/i, clover: "Piece Remplacement/ Electronique", site: "equipment", confidence: "medium" },
  { pattern: /cricket|grillon|dubia|blaptica|blatte|roach|superworm|mealworm|worm|insecte|collembole|springtail|ASF adulte|feeder|bruche du haricot/i, clover: "Insecte Vivant", site: "food_live", confidence: "high" },
  { pattern: /vitamin|calcium|supplement|repti.?boost|electrolyte|probiotic|d3\b/i, clover: "Supplement", site: "supplement", confidence: "medium" },
  { pattern: /frozen|congel|surgel|freez/i, clover: "Nourriture", site: "food_frozen", confidence: "medium" },
];

const ANIMAL_NAME_PATTERNS = [
  /\bboa\b/i, /\bpython\b/i, /\bball python\b/i, /\bcorn snake\b/i, /\bserpent\b/i,
  /\bgecko\b/i, /\bgargoyle\b/i, /\bcrested\b/i, /\bleachianus\b/i,
  /\blezard\b/i, /\blézard\b/i, /\bskink\b/i, /\bchameleon\b/i, /\bcaméléon\b/i,
  /\biguana\b/i, /\bmonitor\b/i, /\bvaran\b/i, /\btegu\b/i, /\buromastyx\b/i,
  /\bbearded\b/i, /\bdragon\b/i, /\btortue\b/i, /\bfrog\b/i, /\bgrenouille\b/i,
  /\bsalamander\b/i, /\bsalamandre\b/i, /\btarantula\b/i, /\btheraphosa\b/i,
  /\bpoecilotheria\b/i, /\bacanthoscurria\b/i, /\bacanthosaura\b/i, /\bscorpion\b/i,
  /\bisopod\b/i, /\bfourmi\b/i, /\bhamster\b/i, /\brat\b|\bmouse\b|\bsouris\b/i,
  /\bfemale\b|\bmale\b|\bfemelle\b|\bhet\b|\bsuper\b|\bmorph\b/i,
];

const IGNORE_PATTERNS = [
  /certificat cadeau|gift certificate/i,
  /^frais |shipping|livraison|deposit|consigne|service fee/i,
];

const BRAND_PREFIXES: { pattern: RegExp; brand: string }[] = [
  { pattern: /^DR\d/i, brand: "Repashy" },
  { pattern: /^PT\d/i, brand: "Exo Terra" },
  { pattern: /^Z99|^Z98|^Z97/i, brand: "Zoo Med" },
  { pattern: /^021\d|^101\d|^126\d|^137\d|^219\d|^484\d|^654\d|^769\d|^783\d/i, brand: "La Swamp / misc SKU" },
  { pattern: /^5TNL/i, brand: "Mazuri" },
  { pattern: /repashy/i, brand: "Repashy" },
  { pattern: /exoterra|exo terra/i, brand: "Exo Terra" },
  { pattern: /zoomed|zoo\s*med/i, brand: "Zoo Med" },
  { pattern: /zilla/i, brand: "Zilla" },
  { pattern: /atasuki/i, brand: "Atasuki" },
  { pattern: /mazuri/i, brand: "Mazuri" },
  { pattern: /caribsea/i, brand: "CaribSea" },
  { pattern: /jurassic/i, brand: "Jurassic" },
];

function detectBrand(name: string): string {
  for (const { pattern, brand } of BRAND_PREFIXES) {
    if (pattern.test(name)) return brand;
  }
  return "";
}

function cleanDisplayName(name: string): string {
  let cleaned = name.trim();
  // Strip leading numeric/alphanumeric SKU codes like "DR046 ", "02110 ", "PT2255 "
  cleaned = cleaned.replace(/^[A-Z0-9]{2,6}\s+(?=[A-Za-z])/, "");
  cleaned = cleaned.replace(/^\d{5}\s+/, "");
  return cleaned.trim();
}

function classifyByName(name: string): Partial<Classification> | null {
  if (IGNORE_PATTERNS.some((p) => p.test(name))) {
    return {
      recordType: "ignore",
      suggestedSiteCategory: "",
      suggestedCloverCategory: "",
      keepCloverCategory: true,
      confidence: "high",
      reason: "Certificat / frais / service — no publicar en boutique",
    };
  }

  if (ANIMAL_NAME_PATTERNS.some((p) => p.test(name))) {
    let clover = "Serpent";
    if (/tarantula|araign|scorpion|theraphosa|poecilotheria|acanthoscurria|isopod|collembole|fourmi/i.test(name)) {
      clover = "Isopod et Araignee et Fourmis";
    } else if (/gecko|lezard|lézard|skink|chameleon|iguana|tegu|uromastyx|bearded|dragon|monitor|varan|acanthosaura/i.test(name)) {
      clover = "Lezard";
    } else if (/frog|grenouille|salamander|salamandre|amphibien|crocodile skink/i.test(name)) {
      clover = "Amphibien";
    } else if (/hamster|rat|mouse|souris|rongeur/i.test(name)) {
      clover = "Rongeur";
    } else if (/python|boa|serpent|corn snake|ball python/i.test(name)) {
      clover = "Serpent";
    }

    return {
      recordType: "animal",
      suggestedSiteCategory: "",
      suggestedCloverCategory: clover,
      keepCloverCategory: false,
      confidence: "medium",
      reason: `Nombre sugiere animal vivo → categoría Clover existente "${clover}"`,
    };
  }

  for (const rule of UNCategorized_TO_CLOVER) {
    if (rule.pattern.test(name)) {
      return {
        recordType: "product",
        suggestedSiteCategory: rule.site,
        suggestedCloverCategory: rule.clover,
        keepCloverCategory: false,
        confidence: rule.confidence,
        reason: `Patrón nombre → Clover "${rule.clover}" / sitio "${rule.site}"`,
      };
    }
  }

  return null;
}

export function classifyItem(input: {
  name: string;
  cloverCategoryName: string | null;
  currentSiteCategory?: ProductCategoryValue | null;
}): Classification {
  const brand = detectBrand(input.name);
  const cleanNameFr = cleanDisplayName(input.name);

  // 1. If Clover category exists and maps cleanly — trust Clover, minimal change
  if (input.cloverCategoryName) {
    if (looksLikeAnimalCategory(input.cloverCategoryName)) {
      return {
        recordType: "animal",
        suggestedSiteCategory: "",
        suggestedCloverCategory: input.cloverCategoryName,
        keepCloverCategory: true,
        confidence: "high",
        reason: `Categoría Clover animal existente — mantener "${input.cloverCategoryName}"`,
        cleanNameFr,
        brand,
      };
    }

    const siteCat = suggestProductCategory(input.cloverCategoryName);
    if (siteCat) {
      return {
        recordType: "product",
        suggestedSiteCategory: siteCat,
        suggestedCloverCategory: input.cloverCategoryName,
        keepCloverCategory: true,
        confidence: "high",
        reason: `Mapeo directo Clover → sitio (sin cambiar Clover)`,
        cleanNameFr,
        brand,
      };
    }
  }

  // 2. No Clover category — infer from name
  const byName = classifyByName(input.name);
  if (byName) {
    return {
      recordType: byName.recordType ?? "review",
      suggestedSiteCategory: byName.suggestedSiteCategory ?? "",
      suggestedCloverCategory: byName.suggestedCloverCategory ?? "",
      keepCloverCategory: byName.keepCloverCategory ?? false,
      confidence: byName.confidence ?? "low",
      reason: byName.reason ?? "",
      cleanNameFr,
      brand,
    };
  }

  // 3. Fallback — needs human review
  return {
    recordType: "review",
    suggestedSiteCategory: "",
    suggestedCloverCategory: "",
    keepCloverCategory: true,
    confidence: "low",
    reason: "Sin categoría Clover y sin patrón reconocido — revisión manual",
    cleanNameFr,
    brand,
  };
}

export function getCloverToSiteMapping(): {
  cloverCategory: string;
  siteCategory: ProductCategoryValue | "(animales → /animals)";
  action: string;
  changeClover: string;
  itemCount?: number;
}[] {
  return [
    { cloverCategory: "Habitat", siteCategory: "terrarium", action: "auto_product", changeClover: "No cambiar", itemCount: 24 },
    { cloverCategory: "Substrat", siteCategory: "substrate", action: "auto_product", changeClover: "No cambiar", itemCount: 51 },
    { cloverCategory: "Decoration", siteCategory: "decor", action: "auto_product", changeClover: "No cambiar", itemCount: 114 },
    { cloverCategory: "Roche Et Bois/Cork", siteCategory: "decor", action: "auto_product (regla pendiente)", changeClover: "No cambiar", itemCount: 8 },
    { cloverCategory: "Plante Vivant", siteCategory: "decor", action: "auto_product (regla pendiente)", changeClover: "No cambiar", itemCount: 7 },
    { cloverCategory: "Lumiere", siteCategory: "lighting", action: "auto_product", changeClover: "No cambiar", itemCount: 83 },
    { cloverCategory: "Piece Remplacement/ Electronique", siteCategory: "equipment", action: "auto_product", changeClover: "No cambiar", itemCount: 111 },
    { cloverCategory: "Insecte Vivant", siteCategory: "food_live", action: "auto_product", changeClover: "No cambiar", itemCount: 46 },
    { cloverCategory: "Nourriture", siteCategory: "food_packaged", action: "auto_product", changeClover: "No cambiar — revisar si hay congelados", itemCount: 138 },
    { cloverCategory: "Supplement", siteCategory: "supplement", action: "auto_product", changeClover: "No cambiar", itemCount: 14 },
    { cloverCategory: "Serpent", siteCategory: "(animales → /animals)", action: "crear Animal individual", changeClover: "No cambiar", itemCount: 400 },
    { cloverCategory: "Lezard", siteCategory: "(animales → /animals)", action: "crear Animal individual", changeClover: "No cambiar", itemCount: 105 },
    { cloverCategory: "Rongeur", siteCategory: "(animales → /animals)", action: "animal o food_live según item", changeClover: "Opcional: separar feeders (ASF) a Insecte Vivant", itemCount: 36 },
    { cloverCategory: "Amphibien", siteCategory: "(animales → /animals)", action: "crear Animal individual", changeClover: "No cambiar", itemCount: 29 },
    { cloverCategory: "Isopod et Araignee et Fourmis", siteCategory: "(animales → /animals)", action: "crear Animal individual", changeClover: "No cambiar", itemCount: 24 },
    { cloverCategory: "(Sans catégorie)", siteCategory: "varía", action: "ver CSV pendientes", changeClover: "Asignar categoría Clover existente (no crear nuevas)", itemCount: 588 },
  ];
}

export { EXISTING_CLOVER_CATEGORIES };
