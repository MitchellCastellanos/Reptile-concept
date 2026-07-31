// Single source of truth for the Product category enum values — kept in its
// own file (no server-only imports) so client components (product-form,
// category-bulk-actions) can import it directly alongside server code.
//
// Reshaped in 2026-07 to match the client's real Clover catalog instead of
// a guessed taxonomy: "lighting" (bulbs/heat), "equipment" (spare parts,
// sealants, filters) and "supplement" (vitamins, care products) didn't
// exist before and had nowhere for ~200 real Clover items to go.
export const PRODUCT_CATEGORIES = [
  "terrarium",
  "substrate",
  "decor",
  "lighting",
  "equipment",
  "food_live",
  "food_frozen",
  "food_packaged",
  "supplement",
] as const;

export type ProductCategoryValue = (typeof PRODUCT_CATEGORIES)[number];

export function isProductCategory(value: string | undefined): value is ProductCategoryValue {
  return !!value && (PRODUCT_CATEGORIES as readonly string[]).includes(value);
}
