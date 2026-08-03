import type { AnimalCategoryValue } from "@/lib/animal-categories";
import { inferAnimalCategoryFromMorph } from "@/lib/animal-category-inference";

export type SpeciesCandidate = {
  scientificName: string;
  category: AnimalCategoryValue;
  animalCount: number;
  exampleNames: string[];
  source: "scientific" | "trade-map" | "common";
};

const FEEDER_RE =
  /\b(ASF|grillon|cricket|vers de|mealworm|superworm|dubia|roach|blaptica|blatte|feeder|nourriture vivante|bruche du haricot)\b/i;

const MERCH_IN_ANIMAL_CATEGORY_RE =
  /\b(repashy|pangea|gecko diet|beardie|hikari|exo terra|pt\d{3}|dr\d{3}|z\d{3}|bol gecko|grotte pour gecko|terrarium équipé|complete gecko diet|mulberry madness|pineapple express|mango tango|gourmet bearded|frog pond|dart frog terrarium|liquid feeder|super hatch|incubation|aquatic newt food|terrestrial isopod kit)\b/i;

/** Clover snake-morph listings without "python" in the title (batch imports). */
const BALL_PYTHON_MORPH_RE =
  /\b(banana|het|pied|enchi|pinstripe|mojave|pastel|clown|spider|bamboo|yellowbelly|yellow belly|\byb\b|\bod\b|axanthic|ghost|lesser|super|piebald|pinstripe|dm\b)\b/i;

const CLOVER_SNAKE_CATEGORY = /^(serpent|snake)$/i;

const TRADE_SPECIES_MAP: [RegExp, string][] = [
  [/python\s+royale|ball\s+python/i, "Python regius"],
  [/\bboa\b(?!\s*constrictor)/i, "Boa constrictor"],
  [/corn\s*snake|corn\s+scaleless|shiping\s+corn/i, "Pantherophis guttatus"],
  [/leopard\s+gecko/i, "Eublepharis macularius"],
  [/crested\s+gecko|gecko\s+à\s+crête|gecko a cr/i, "Correlophus ciliatus"],
  [/gargoyle\s+gecko/i, "Rhacodactylus auriculatus"],
  [/leachieanus|leachianus/i, "Rhacodactylus leachianus"],
  [/tortue\s+hermann/i, "Testudo hermanni"],
  [/tortue\s+sulcata/i, "Centrochelys sulcata"],
  [/tortue\s+grecque/i, "Testudo graeca"],
  [/tortue\s+russe/i, "Testudo horsfieldii"],
  [/marginated\s+tortoise/i, "Testudo marginata"],
  [/tortue\s+yellow\s+bellied|yellow\s+bellied/i, "Trachemys scripta"],
  [/tortue\s+red\s*foot|redfooted/i, "Chelonoidis carbonarius"],
  [/atb|amazon\s+tree\s+boa/i, "Corallus hortulanus"],
  [/carpet\s+python/i, "Morelia spilota"],
  [/blood\s+python/i, "Python brongersmai"],
  [/green\s+tree\s+python/i, "Morelia viridis"],
  [/bearded\s+dragon|dragon\s+barbu|pogona/i, "Pogona vitticeps"],
  [/crocodile\s+skink/i, "Tribolonotus gracilis"],
  [/african\s+house\s+snake/i, "Lamprophis fuliginosus"],
  [/black\s+rat\s+snake/i, "Pantherophis obsoletus"],
  [/fire\s+skink/i, "Mochlus fernandi"],
  [/madagascar\s+spiny/i, "Oplurus cuvieri"],
  [/lacerta\s+m[ée]lanique/i, "Timon lepidus"],
  [/agame\s+peint/i, "Pogona henrylawsoni"],
  [/tinctorius/i, "Dendrobates tinctorius"],
  [/dendrobates\s+oophaga|oophaga\s+paru/i, "Oophaga pumilio"],
  [/tliltocatl/i, "Tliltocatl kahlenbergi"],
  [/jumping\s+spider|araignée\s+sauteuse/i, "Phidippus audax"],
  [/mante\s+religieuse/i, "Mantis religiosa"],
  [/tad-?pool/i, "Dendrobates tinctorius"],
];

const COMMON_WORDS = new Set([
  "Male",
  "Femelle",
  "Python",
  "Eastern",
  "Western",
  "Black",
  "White",
  "Super",
  "Poss",
  "Banana",
  "Corn",
  "Shiping",
  "Tortue",
  "Gecko",
  "Serpent",
  "Boa",
  "Fire",
  "Ball",
  "Coral",
  "Chain",
  "Baby",
  "Dan",
  "Mike",
  "Noir",
  "Bleu",
  "Jaune",
  "African",
  "Chinese",
  "Costa",
  "Mississippi",
  "Yellow",
  "Red",
  "Green",
  "Blue",
  "Couple",
]);

function isLikelyGenus(w: string) {
  return w.length >= 4 && /^[A-Z][a-z]+$/.test(w) && !COMMON_WORDS.has(w);
}

function normalizeSci(s: string) {
  return s.replace(/\s+/g, " ").trim();
}

export function extractScientificName(name: string): string | null {
  if (!name) return null;

  const paren = name.match(
    /\(\s*([A-Z][a-z]+(?:\.?\s+[a-z]+(?:\s+[a-z]+)?)?)\s*\)?/,
  );
  if (paren) return normalizeSci(paren[1]);

  // Unclosed paren: "Garter Snake ( Thamnophis cyrtopsis ocellatus"
  const afterOpenParen = name.match(/\(\s*([A-Z][a-z]+\s+[a-z]+(?:\s+[a-z]+)?)\s*$/);
  if (afterOpenParen && isLikelyGenus(afterOpenParen[1].split(/\s+/)[0])) {
    return normalizeSci(afterOpenParen[1]);
  }

  const abbrev = name.match(/\b([A-Z]\.\s+[a-z]+(?:\s+[a-z]+)?)\b/);
  if (abbrev) return normalizeSci(abbrev[1]);

  const binomials = [...name.matchAll(/\b([A-Z][a-z]{2,})\s+([a-z]{2,}(?:\s+[a-z]+)?)\b/g)];
  for (const m of binomials) {
    if (isLikelyGenus(m[1])) return normalizeSci(`${m[1]} ${m[2]}`);
  }

  const genusSpeciesCap = name.match(/\b([A-Z][a-z]{4,})\s+([A-Z][a-z]+)\b/);
  if (genusSpeciesCap && isLikelyGenus(genusSpeciesCap[1])) {
    return normalizeSci(`${genusSpeciesCap[1]} ${genusSpeciesCap[2].toLowerCase()}`);
  }

  return null;
}

export function isMerchandiseMisimportedAsAnimal(name: string) {
  return MERCH_IN_ANIMAL_CATEGORY_RE.test(name);
}

export function shouldSkipAnimalName(name: string) {
  return FEEDER_RE.test(name) || isMerchandiseMisimportedAsAnimal(name);
}

export function inferSpeciesCandidate(
  name: string,
  cloverCategoryName?: string | null,
): Omit<SpeciesCandidate, "animalCount" | "exampleNames"> | null {
  if (shouldSkipAnimalName(name)) return null;

  const category = inferAnimalCategoryFromMorph(name, cloverCategoryName);
  const cloverKey = cloverCategoryName?.trim().toLowerCase() ?? "";

  if (CLOVER_SNAKE_CATEGORY.test(cloverKey) && BALL_PYTHON_MORPH_RE.test(name)) {
    return { scientificName: "Python regius", category: "reptiles_snakes", source: "trade-map" };
  }

  const sci = extractScientificName(name);
  if (sci) {
    return { scientificName: sci, category, source: "scientific" };
  }

  for (const [pattern, scientificName] of TRADE_SPECIES_MAP) {
    if (pattern.test(name)) {
      return { scientificName, category, source: "trade-map" };
    }
  }

  const cleaned = name
    .replace(/\([^)]*\)/g, "")
    .replace(/\b(Male|Femelle|M|F|BB|Yearling|Juvenile|Adult|Subadult|Baby|Hatchling|\d+\+|mâle|male|couple)\b/gi, "")
    .replace(
      /\b(Het|Super|Pastel|Banana|Pied|Ghost|Albino|Axanthic|Caramel|Leucistic|Hypo|Anery|Stripe|Motley|Amelanistic|Hypomelanistic|VPI|Asphalt|Yb|Scaleless|Okeetee)[^,]*/gi,
      "",
    )
    .trim();

  if (cleaned.length < 3) return null;

  const label = cleaned.split(/\s+/).slice(0, 3).join(" ");
  return {
    scientificName: label,
    category,
    source: "common",
  };
}

export function groupSpeciesCandidates(
  items: { name: string; cloverCategoryName?: string | null }[],
): SpeciesCandidate[] {
  const map = new Map<string, SpeciesCandidate>();

  for (const item of items) {
    const inferred = inferSpeciesCandidate(item.name, item.cloverCategoryName);
    if (!inferred) continue;

    const key = normalizeScientificNameKey(inferred.scientificName);
    const scientificName = canonicalScientificName(inferred.scientificName);
    const existing = map.get(key);
    if (existing) {
      existing.animalCount++;
      if (existing.exampleNames.length < 3 && !existing.exampleNames.includes(item.name)) {
        existing.exampleNames.push(item.name);
      }
      continue;
    }

    map.set(key, {
      ...inferred,
      scientificName,
      animalCount: 1,
      exampleNames: [item.name],
    });
  }

  return [...map.values()].sort((a, b) => b.animalCount - a.animalCount || a.scientificName.localeCompare(b.scientificName));
}

const CANONICAL_SCIENTIFIC_NAMES: Record<string, string> = {
  "python regius": "Python regius",
  "boa constrictor": "Boa constrictor",
  "correlophus ciliatus": "Correlophus ciliatus",
  "pantherophis guttatus": "Pantherophis guttatus",
  "testudo marginata": "Testudo marginata",
  "oplurus cuvieri": "Oplurus cuvieri",
  "timon lepidus": "Timon lepidus",
};

export function normalizeScientificNameKey(name: string) {
  const lower = name.toLowerCase().replace(/\s+/g, " ").trim();
  const aliases: Record<string, string> = {
    "python roy.": "python regius",
    "python roy": "python regius",
    "python royal": "python regius",
    "python royale": "python regius",
    "crested gecko": "correlophus ciliatus",
    "gecko a crete": "correlophus ciliatus",
    "gecko à crête": "correlophus ciliatus",
    "boa régulier": "boa constrictor",
    "boa regulier": "boa constrictor",
    "timon lepidus": "timon lepidus",
    "jeweled lacerta": "timon lepidus",
    "dendrobates tinctorius": "dendrobates tinctorius",
    "dendrobate tinctorius": "dendrobates tinctorius",
    "oophaga pumilio": "oophaga pumilio",
    "dendrobate oophaga": "oophaga pumilio",
    "porcellio spinicornis": "porcellio spinicornis",
    "isopod porcellio": "porcellio spinicornis",
    "thamnophis cyrtopsis ocellatus": "thamnophis cyrtopsis",
  };
  return aliases[lower] ?? lower;
}

export function canonicalScientificName(name: string) {
  const key = normalizeScientificNameKey(name);
  return CANONICAL_SCIENTIFIC_NAMES[key] ?? name;
}
