import { readdirSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import {
  CATEGORY_FALLBACK_PATTERNS,
  extractBareZCode,
  Z_CODE_IMAGE_PATTERNS,
} from "./zoomed-zcode-lookup";

export type MatchTier = "high" | "medium" | "low" | "none";

export type ImageMatch = {
  relativePath: string;
  absolutePath: string;
  fileName: string;
  tier: MatchTier;
  method: string;
};

export type IndexedImage = {
  relativePath: string;
  absolutePath: string;
  fileName: string;
  stemNorm: string;
  nameLower: string;
};

const IMG_ROOT = join(process.cwd(), "public/Inventory pictures/ZooMed Product Image JPEGs");

const Z995_MAP: Record<string, string> = {
  "": "NT-1",
  A: "NT-2",
  B: "NT-3",
  C: "NT-4",
  D: "NT-5",
  E: "NT-40",
  F: "NT-25",
  G: "NT-10",
  H: "NT-32",
};

const EXCLUDE_NAME = /\bPT\d{4}\b|\bDR\d{3}\b|mazuri|repashy|exoterra|exo terra|reptile treasures|reptile munchie|jurassic/i;

type Rule = { pattern: RegExp; patterns: string[]; tier?: MatchTier };

const RULES: Rule[] = [
  { pattern: /electrolyte soak/i, patterns: ["electrolyte soak", "md-20", "md-21", "md-22"] },
  { pattern: /eco carpet/i, patterns: ["ecocarpet", "eco-carpet", "cc-10", "cc-15", "cc-20", "cc-24", "cc-30"] },
  { pattern: /vita sand/i, patterns: ["vita-sand", "vb-"] },
  { pattern: /forest floor|cypres/i, patterns: ["forest-floor", "forestfloor", "cm-8", "cm-24", "cm-4", "cm-1"] },
  { pattern: /aspen snake|aspen.*bedding/i, patterns: ["aspen", "sb-8", "sb-24", "sb-4", "sb-1"] },
  { pattern: /repti soil|reptisoil/i, patterns: ["reptisoil", "rss-10", "rss-24"] },
  { pattern: /frog moss/i, patterns: ["frog-moss", "cf3-fm"] },
  { pattern: /sphagnum|sphgnum/i, patterns: ["sphagnum", "cf2-nz", "cf3-nz"] },
  { pattern: /creature soil|creatures eco soil/i, patterns: ["creature-soil", "creature", "eco-soil"] },
  { pattern: /repti bark/i, patterns: ["repti-bark", "rb-"] },
  { pattern: /ceramic heat|heat emitter/i, patterns: ["ceramic", "ce-100", "ce-150", "ce-250", "heat-emit"] },
  { pattern: /paludarium heater|turtletherm/i, patterns: ["ph-25", "ph-50", "ph-100", "palud_heater", "turtletherm", "th-100", "th-150", "th-300"] },
  { pattern: /reptisun/i, patterns: ["reptisun"] },
  { pattern: /reptibreeze/i, patterns: ["reptibreeze", "nt-10", "nt-11", "nt-12"] },
  { pattern: /rock heater|snake strip/i, patterns: ["rock-heater", "rh-", "snake-strip", "snake strip"] },
  { pattern: /turtle eye/i, patterns: ["eye drop", "turtle-eye", "md-4", "md-5"] },
  { pattern: /repti lock/i, patterns: ["repti-lock", "rl-"] },
  { pattern: /terrarium mesh/i, patterns: ["mesh", "nt-m"] },
  { pattern: /low boy/i, patterns: ["low-boy", "lowboy"] },
  { pattern: /terrarium moss/i, patterns: ["terrarium-moss", "tm-"] },
  { pattern: /bioactive|bioblend/i, patterns: ["bio-active", "bioblend", "bak-"] },
  { pattern: /repti sand|reptisand/i, patterns: ["repti-sand", "reptisand", "sm-10", "sr-10", "sw-"] },
  { pattern: /repti calcium|repticalcium|reptivite/i, patterns: ["repti-calcium", "rc-", "repticalcium", "reptivite", "a35-"] },
  { pattern: /hermit crab/i, patterns: ["hermit"] },
  { pattern: /bug napper|bugnapper/i, patterns: ["bugnapper", "bn-"] },
  { pattern: /aquarocks|aqua rocks/i, patterns: ["aquarocks", "aqua-rocks", "ar-"] },
  { pattern: /repti fresh/i, patterns: ["repti-fresh", "rf-"] },
  { pattern: /turtle dock|floating turtle/i, patterns: ["turtle-dock", "floating"] },
  { pattern: /thermostat/i, patterns: ["thermostat", "ts-"] },
  { pattern: /feeder bowl|repti bowl|corner bowl/i, patterns: ["feeder", "fd-", "corner-bowl", "kb-"] },
  { pattern: /eco earth/i, patterns: ["eco-earth", "ee-"] },
  { pattern: /paludarium/i, patterns: ["paludarium", "fs-cp", "nt-2p", "nt-3p"] },
  { pattern: /screen cover|screen top|galscrn/i, patterns: ["screen", "galscrn", "086"] },
  { pattern: /chameleon kit/i, patterns: ["chameleon", "nt-11ck", "nt-12ck"] },
  { pattern: /gecko kit|leopard gecko kit/i, patterns: ["gecko-kit", "gecko kit", "10-gal-gecko"] },
  { pattern: /habba hut/i, patterns: ["habba-hut", "hh-"] },
  { pattern: /waterfall kit|waterfall/i, patterns: ["waterfall"] },
  { pattern: /excavator|cavern kit/i, patterns: ["excavator", "cavern", "xr-"] },
  { pattern: /lace fern|sword fern|tillandsia|air plant/i, patterns: ["lace", "sword fern", "tillandsia", "air-plant", "bu-63", "fern"] },
  { pattern: /cricket.*block|gutload|banquet block/i, patterns: ["cricket", "bb-60", "banquet"] },
  { pattern: /red shrimp|brine shrimp/i, patterns: ["shrimp", "brine-shrimp"] },
  { pattern: /anolis food|anole food/i, patterns: ["anolis", "anole"] },
  { pattern: /iguana food|adult iguana/i, patterns: ["iguana food", "iguana"] },
  { pattern: /crested gecko food|crested gecko f/i, patterns: ["crested-gecko", "cgf-", "gecko food", "crested gecko"] },
  { pattern: /isopod.*food|isopod medley|isopod banquet/i, patterns: ["isopod"] },
  { pattern: /basking spot|basking.*combo|bearded dragon combo/i, patterns: ["basking", "combo", "lf-"] },
  { pattern: /nocturnal.*infrared|infrared heat projector|heat projector/i, patterns: ["nocturnal", "infrared", "projector", "reptituff", "rs-100"] },
  { pattern: /nano led/i, patterns: ["nano-led", "nano led", "es-5n"] },
  { pattern: /terrapump|terrarium pump|repti-flo|repti flo/i, patterns: ["terrapump", "tc-70", "tc-701", "repti-flo"] },
  { pattern: /minuterie|timer/i, patterns: ["timer", "minut", "lt-"] },
  { pattern: /feeding tongs/i, patterns: ["feeding-tongs", "tongs", "ta-20"] },
  { pattern: /hook.*gator|collapsible hook|snake hook/i, patterns: ["hook", "gator", "ta-25"] },
  { pattern: /reptisafe|repti safe/i, patterns: ["repti-safe", "reptisafe"] },
  { pattern: /wipe out/i, patterns: ["wipe-out", "wipeout", "wipe out"] },
  { pattern: /can o|can-o/i, patterns: ["can-o", "cano"] },
  { pattern: /repti rock|rock water dish|rock dish/i, patterns: ["repti-rock", "rock-dish", "fd-20", "fd-30", "fd-40"] },
  { pattern: /wire cage clamp|cage clamp lamp/i, patterns: ["clamp", "z114", "lf-19"] },
  { pattern: /economy lamp stand|lf-21/i, patterns: ["lamp stand", "lf-21"] },
  { pattern: /coconut chips/i, patterns: ["coconut-chip", "coconut chip"] },
  { pattern: /splashproof halogen/i, patterns: ["splashproof", "halogen", "z232"] },
  { pattern: /jumping spider kit/i, patterns: ["jumping-spider", "spider-kit", "spider kit", "spider"] },
  { pattern: /creatures habitat kit|creatures den/i, patterns: ["creatures", "habitat kit", "den low"] },
  { pattern: /creatures led black light/i, patterns: ["black-light", "black light"] },
  { pattern: /creatures white sand/i, patterns: ["white sand"] },
  { pattern: /creatures rock bowl|creature view magnifier/i, patterns: ["rock bowl", "magnifier"] },
  { pattern: /steampunk|bear skull/i, patterns: ["steampunk", "skull"] },
  { pattern: /purevue|aquarium sans monture/i, patterns: ["purevue"] },
  { pattern: /green aloe/i, patterns: ["green-aloe", "aloe", "bu-73"] },
  { pattern: /nano combo dome hold|hold down kit/i, patterns: ["hold-down", "lf-35c", "lf-36c"] },
  { pattern: /probe zoomed|digital probe/i, patterns: ["thermometer", "hygrometer", "th-", "probe"] },
  { pattern: /repti therm|repti.?therm|\buth\b/i, patterns: ["repti-therm", "repti therm", "uth", "heat mat", "tank heater"] },
  { pattern: /aquatic turtle.*light|turtle.*uvb.*heat|turtle lighting combo/i, patterns: ["aquatic-turtle", "aquatic turtle", "turtle-combo", "turtle kit"] },
  { pattern: /repti lamp stand|lf-20|lf-21|economy lamp stand/i, patterns: ["lf-20", "lf-21", "lamp stand", "floor-lamp", "floor lamp"] },
  { pattern: /turtleclean|turtle clean filter/i, patterns: ["turtleclean", "turtle-clean", "turtle filter", "tf-"] },
  { pattern: /repti reservoir/i, patterns: ["reservoir", "repti-reservoir"] },
  { pattern: /repti chips/i, patterns: ["repti-chips", "repti chips", "reptichips"] },
  { pattern: /jackfruit|leaf litter/i, patterns: ["jackfruit", "leaf-litter", "leaf litter", "litter"] },
  { pattern: /pvc terrarium|120gallon|120 gallon/i, patterns: ["pvc", "120-gallon", "120 gallon", "nt-50", "nt-60"] },
  { pattern: /turtle banquet|aquatic turtle banquet/i, patterns: ["turtle-banquet", "banquet-block", "bb-51"] },
  { pattern: /repti tweezers|feeding tongs 25/i, patterns: ["tweezers", "tongs", "ta-25", "ta-20"] },
  { pattern: /powersun|power sun/i, patterns: ["powersun", "power-sun"] },
  { pattern: /nightlight red|night light red/i, patterns: ["nightlight", "night-light", "red-bulb", "red bulb"] },
  { pattern: /daylight blue/i, patterns: ["daylight-blue", "daylight blue", "blue-bulb"] },
  { pattern: /repti hammock|repti hammocks/i, patterns: ["hammock"] },
  { pattern: /betta food/i, patterns: ["betta"] },
  { pattern: /bearded dragon food|gourmet bearded/i, patterns: ["bearded-dragon", "bearded dragon", "gourmet"] },
  { pattern: /axolotl|newt food|aquatic newt/i, patterns: ["axolotl", "newt"] },
  { pattern: /frog terrarium kit/i, patterns: ["frog", "nt-2", "10-gal"] },
  { pattern: /nano basking|nano halogen/i, patterns: ["nano-bask", "nano bask", "nano-halogen", "nano halogen"] },
  { pattern: /turtle eye drop/i, patterns: ["eye drop", "turtle-eye", "md-4", "md-5", "turtle"] },
  { pattern: /aquatic turtle tub|turtle tub/i, patterns: ["turtle-tub", "turtle tub", "turtletub"] },
  { pattern: /creatures rock bowl|rock dish/i, patterns: ["rockdish", "rock-dish", "ct-85"] },
  { pattern: /creature view magnifier|creatures.*magnifier/i, patterns: ["magnifier", "view"] },
  { pattern: /creatures led lamp|creatures led black/i, patterns: ["creatures", "ct-35", "black-light"] },
  { pattern: /creatures floor/i, patterns: ["creatures", "creature"] },
  { pattern: /creatures beetle|beetle food/i, patterns: ["beetle", "creatures"] },
  { pattern: /creatures isopod|isopods medley/i, patterns: ["isopod", "creatures", "ct-60"] },
  { pattern: /creatures white sand/i, patterns: ["white-sand", "white sand", "creatures"] },
  { pattern: /t8.*10\.0|10\.0 uvb/i, patterns: ["t8", "10.0", "reptisun"] },
];

function norm(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function isStrictZoomedProductName(name: string): boolean {
  if (EXCLUDE_NAME.test(name)) return false;
  if (/\bZ\d{3}[A-Z]?\b/i.test(name)) return true;
  if (/\bzoomed\b|\bzoo\s*med\b/i.test(name)) return true;
  if (/^\d{5}\s+.*zoomed/i.test(name)) return true;
  return false;
}

export function extractZCode(name: string): string | null {
  const m = name.match(/\b(Z\d{3}[A-Z]?)\b/i);
  return m ? m[1].toUpperCase() : null;
}

function extractNtCode(name: string): string | null {
  const paren = name.match(/\((NT-\d+[A-Z0-9-]*)\)/i);
  if (paren) return paren[1].toUpperCase();

  const inline = name.match(/\b(NT-\d+[A-Z0-9-]*)\b/i);
  if (inline) return inline[1].toUpperCase();

  const z995 = name.match(/\bZ995([A-Z]?)\b/i);
  if (z995) return Z995_MAP[z995[1].toUpperCase()] ?? null;

  return null;
}

function cleanProductName(name: string): string {
  return name
    .replace(/^[A-Z0-9]{2,6}\s+/, "")
    .replace(/^Z\d{3}[A-Z]?\s+/i, "")
    .replace(/^(Zoo\s*Med|Zoomed)\s+/i, "")
    .trim();
}

function walkImages(dir: string, base = dir): IndexedImage[] {
  const out: IndexedImage[] = [];
  for (const entry of readdirSync(dir)) {
    const abs = join(dir, entry);
    const st = statSync(abs);
    if (st.isDirectory()) {
      out.push(...walkImages(abs, base));
      continue;
    }
    if (!/\.jpe?g$/i.test(entry)) continue;
    const relativePath = relative(base, abs).replace(/\\/g, "/");
    out.push({
      relativePath,
      absolutePath: abs,
      fileName: entry,
      stemNorm: norm(entry.replace(/\.jpe?g$/i, "")),
      nameLower: entry.toLowerCase(),
    });
  }
  return out;
}

let cachedImages: IndexedImage[] | null = null;

export function getIndexedImages(): IndexedImage[] {
  if (!cachedImages) cachedImages = walkImages(IMG_ROOT);
  return cachedImages;
}

function findBySubstrings(patterns: string[], images: IndexedImage[]): IndexedImage[] {
  return images.filter((img) => patterns.some((p) => img.nameLower.includes(p.toLowerCase())));
}

function scoreByWattage(name: string, candidates: IndexedImage[]): IndexedImage | null {
  const w = name.match(/(\d+)\s*w(?:att)?/i);
  if (!w) return candidates[0] ?? null;
  const watt = w[1];
  const exact = candidates.find((c) => c.nameLower.includes(watt));
  return exact ?? candidates[0] ?? null;
}

function scoreBySize(name: string, candidates: IndexedImage[]): IndexedImage | null {
  const sizePatterns = [
    [/8\s*qt/i, ["sb-8", "cm-8", "rss-10", "ee-8"]],
    [/24\s*qt/i, ["sb-24", "cm-24", "rss-24", "ee-24"]],
    [/10\s*lb/i, ["10lb", "10-lb", "-10"]],
    [/5\s*oz/i, ["5 oz", "5oz", "-5"]],
    [/medium|\bmed\b|\(m\)/i, ["-m.", "-m-", "medium", " med"]],
    [/large|\blg\b|\(l\)/i, ["-l.", "-l-", "large", " lg"]],
    [/x-?large|xlarge|\bxl\b/i, ["xl", "x-large", "x large"]],
    [/small|\bsm\b|\(s\)/i, ["-sm", " small", "_sm"]],
  ] as const;

  for (const [nameRe, imgHints] of sizePatterns) {
    if (!nameRe.test(name)) continue;
    const sized = candidates.find((c) => imgHints.some((h) => c.nameLower.includes(h)));
    if (sized) return sized;
  }
  return candidates[0] ?? null;
}

function pickBest(name: string, candidates: IndexedImage[]): IndexedImage | null {
  if (candidates.length === 0) return null;
  if (candidates.length === 1) return candidates[0];
  return scoreByWattage(name, [scoreBySize(name, candidates) ?? candidates[0]].filter(Boolean) as IndexedImage[]);
}

function tokenMatch(name: string, images: IndexedImage[]): ImageMatch | null {
  const tokens = norm(cleanProductName(name))
    .split(" ")
    .filter((t) => t.length >= 6 && !["zoomed", "reptile", "terrarium", "naturalistic", "gallons", "gallon"].includes(t));

  for (const tok of tokens.sort((a, b) => b.length - a.length)) {
    const hits = images.filter((img) => img.stemNorm.includes(tok));
    if (hits.length >= 1 && hits.length <= 5) {
      const best = pickBest(name, hits);
      if (best) {
        return {
          relativePath: best.relativePath,
          absolutePath: best.absolutePath,
          fileName: best.fileName,
          tier: hits.length === 1 ? "medium" : "low",
          method: `token:${tok}(${hits.length})`,
        };
      }
    }
  }
  return null;
}

function fuzzyMatch(name: string, images: IndexedImage[]): ImageMatch | null {
  const tokens = norm(cleanProductName(name))
    .split(" ")
    .filter(
      (t) =>
        t.length > 3 &&
        !["zoomed", "reptile", "terrarium", "naturalistic", "double", "door", "with", "gallon", "gallons", "gal", "galons"].includes(t),
    );
  if (tokens.length < 2) return null;

  const phrase = tokens.slice(0, 5).join(" ");
  let best: IndexedImage | null = null;
  let bestScore = 0;

  for (const img of images) {
    let score = 0;
    for (const t of tokens) {
      if (img.stemNorm.includes(t)) score += t.length;
    }
    const ratio = score / Math.max(phrase.length, 1);
    if (ratio > bestScore) {
      bestScore = ratio;
      best = img;
    }
  }

  if (best && bestScore >= 8) {
    return {
      relativePath: best.relativePath,
      absolutePath: best.absolutePath,
      fileName: best.fileName,
      tier: "low",
      method: `tokenScore:${bestScore.toFixed(1)}`,
    };
  }
  return null;
}

export function matchZoomedProductImage(
  productName: string,
  options?: { cloverCategory?: string | null },
): ImageMatch | null {
  if (!isStrictZoomedProductName(productName)) return null;

  const images = getIndexedImages();

  const bareZ = extractBareZCode(productName) ?? extractZCode(productName);
  if (bareZ && Z_CODE_IMAGE_PATTERNS[bareZ]) {
    const hits = findBySubstrings(Z_CODE_IMAGE_PATTERNS[bareZ], images);
    const best = pickBest(productName, hits);
    if (best) {
      return {
        relativePath: best.relativePath,
        absolutePath: best.absolutePath,
        fileName: best.fileName,
        tier: "high",
        method: `zlookup:${bareZ}`,
      };
    }
  }

  const nt = extractNtCode(productName);
  if (nt) {
    const hits = findBySubstrings([nt, nt.replace("-", "")], images);
    const best = pickBest(productName, hits);
    if (best) {
      return {
        relativePath: best.relativePath,
        absolutePath: best.absolutePath,
        fileName: best.fileName,
        tier: "high",
        method: `NT:${nt}`,
      };
    }
  }

  for (const rule of RULES) {
    if (!rule.pattern.test(productName)) continue;
    const hits = findBySubstrings(rule.patterns, images);
    const best = pickBest(productName, hits);
    if (best) {
      return {
        relativePath: best.relativePath,
        absolutePath: best.absolutePath,
        fileName: best.fileName,
        tier: rule.tier ?? "high",
        method: `rule:${rule.pattern.source.slice(0, 40)}`,
      };
    }
  }

  const zCode = extractZCode(productName);
  if (zCode && Z_CODE_IMAGE_PATTERNS[zCode] && !extractBareZCode(productName)) {
    const hits = findBySubstrings(Z_CODE_IMAGE_PATTERNS[zCode], images);
    const best = pickBest(productName, hits);
    if (best) {
      return {
        relativePath: best.relativePath,
        absolutePath: best.absolutePath,
        fileName: best.fileName,
        tier: "medium",
        method: `zlookup:${zCode}`,
      };
    }
  }

  const token = tokenMatch(productName, images);
  if (token) return token;

  if (/\bcreatures\b/i.test(productName)) {
    const hits = findBySubstrings(["creatures", "ct-"], images);
    const best = pickBest(productName, hits);
    if (best) {
      return {
        relativePath: best.relativePath,
        absolutePath: best.absolutePath,
        fileName: best.fileName,
        tier: "low",
        method: "creatures-fallback",
      };
    }
  }

  const cloverCategory = options?.cloverCategory?.trim();
  if (cloverCategory && CATEGORY_FALLBACK_PATTERNS[cloverCategory]) {
    const hits = findBySubstrings(CATEGORY_FALLBACK_PATTERNS[cloverCategory], images);
    const best = pickBest(productName, hits);
    if (best) {
      return {
        relativePath: best.relativePath,
        absolutePath: best.absolutePath,
        fileName: best.fileName,
        tier: "low",
        method: `category:${cloverCategory}`,
      };
    }
  }

  if (extractBareZCode(productName) && cloverCategory) {
    const suffix = productName.match(/([LSMX])$/i)?.[1]?.toUpperCase();
    const sizePatterns =
      suffix === "L"
        ? ["-lrg", " large", "lg", "bu-35", "bu-38", "fd-40", "wd-40"]
        : suffix === "S"
          ? ["-sm", " small", "mini", "bu-10", "bu-18", "fd-20"]
          : suffix === "M"
            ? ["-med", " medium", "bu-25", "bu-26", "fd-30", "wd-30"]
            : suffix === "X"
              ? ["xlarge", "xl", "fd-50", "wd-50"]
              : [];
    if (sizePatterns.length) {
      const hits = findBySubstrings(sizePatterns, images);
      const best = pickBest(productName, hits);
      if (best) {
        return {
          relativePath: best.relativePath,
          absolutePath: best.absolutePath,
          fileName: best.fileName,
          tier: "low",
          method: `size:${suffix}`,
        };
      }
    }
  }

  return fuzzyMatch(productName, images);
}

export function isSkippableGeneric(name: string): boolean {
  return /^(piece zoomed|rack display zoomed used|cage used)$/i.test(name.trim()) || /^Z120[A-Zc]?$/i.test(name.trim());
}
