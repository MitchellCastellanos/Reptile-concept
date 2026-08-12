/**
 * Manual Z-code → image filename patterns (from Zoo Med catalog + sibling SKUs in Clover).
 * Used when Clover only stores "Z115" without a descriptive product name.
 */
export const Z_CODE_IMAGE_PATTERNS: Record<string, string[]> = {
  Z115: ["lf-19-combo", "lf-19-combo-lamp"],
  Z115M: ["lf-19-mini", "lf-19"],
  Z115O: ["lf-22", "trop-lighting"],
  Z115P: ["lf-23", "desert-lighting"],
  Z115R: ["lf-30", "lf-31", "lf-32"],
  Z153: ["lf-50", "nat-terr-hood"],
  Z159S: ["lf-55", "natterr-hood"],
  Z171: ["cricket-care", "zm-171"],
  Z172: ["lf-27", "combo"],
  Z173: ["lf-28", "lf-29"],
  Z174: ["fd-20"],
  Z174M: ["fd-30"],
  Z174L: ["fd-40"],
  Z174X: ["fd-50"],
  Z177: ["wd-20"],
  Z177F: ["fd-20"],
  Z178F: ["fd-40"],
  Z179: ["wd-40"],
  Z179F: ["fd-40"],
  Z181: ["wd-50"],
  Z187: ["ee-", "eco-earth"],
  Z201: ["repti-bark", "rb-"],
  Z202: ["repti-bark", "rb-"],
  Z203: ["repti-bark", "rb-"],
  Z225: ["rr-10", "repti-rapids"],
  Z278B: ["green-aloe", "aloe"],
  Z282A: ["hold-down", "lf-35c"],
  Z290L: ["bu-11", "amazon", "phyllo"],
  Z291L: ["bu-12", "congo-ivy"],
  Z291S: ["bu-12", "sm-congo"],
  Z292L: ["bu-23", "malaysian-fern"],
  Z292S: ["bu-13", "fern"],
  Z293M: ["bu-15", "bolivian-croton"],
  Z293S: ["bu-15", "croton"],
  Z294L: ["bu-38", "lrg-cashuarina", "cashuarina"],
  Z294S: ["bu-18", "sm-cashuarina"],
  Z295M: ["bu-25", "bolivian-croton"],
  Z295S: ["bu-25", "croton"],
  Z296L: ["bu-35", "bolivian-croton"],
  Z296M: ["bu-35"],
  Z296S: ["bu-26", "med-cashuarina"],
  Z297S: ["bu-26", "cashuarina"],
  Z298L: ["bu-38", "lrg-cashuarina"],
  Z298M: ["bu-38"],
  Z299S: ["bu-18", "sm-cashuarina"],
  Z315: ["sp-20", "hammock"],
  Z316: ["sp-21", "hammock"],
  Z329: ["lf-33", "lf-34", "kit"],
  Z565: ["a33-3", "repcalcium", "calcium-powder"],
  Z570: ["a34-3", "repcalciumd"],
  Z724: ["zm-42", "can-o-worms", "canoworms"],
  Z730B: ["zm-45", "can-o-shrimp", "shrimp"],
  Z775A: ["crested-gecko", "cgf-", "gecko-bk"],
  Z776A: ["crested-gecko", "cgf-"],
  Z777: ["zm-50", "aquatic-turtle-food"],
  Z781: ["ta-20", "feeding-tongs"],
};

/** Category hints when only a bare Z-code is known. */
export const CATEGORY_FALLBACK_PATTERNS: Record<string, string[]> = {
  Lumiere: ["lf-19", "combo-lamp", "clamp-lamp", "reptisun"],
  Decoration: ["bu-10", "naturalistic", "habba-hut"],
  "Plante Vivant": ["bu-10", "bu-18", "malaysian-fern", "phyllo"],
  Supplement: ["reptivite", "repcalcium", "a35-", "a33-"],
  Nourriture: ["can-o", "cano", "zm-4", "aquatic-turtle-food"],
  Habitat: ["nt-1", "terrarium"],
  Substrat: ["eco-earth", "forest-floor", "sb-8"],
  "Piece Remplacement/ Electronique": ["thermometer", "hygrometer", "timer"],
};

export function extractBareZCode(name: string): string | null {
  const trimmed = name.trim();
  const m = trimmed.match(/^(Z\d{3}[A-Z]?)$/i);
  return m ? m[1].toUpperCase() : null;
}
