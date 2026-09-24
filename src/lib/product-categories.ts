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

/** The three food categories are browsed together under a "food" parent (like the animal groups). */
export const FOOD_CATEGORIES = ["food_live", "food_frozen", "food_packaged"] as const satisfies readonly ProductCategoryValue[];

export type ProductCategoryGroupKey = "food";

export function isProductCategoryGroup(value: string | undefined): value is ProductCategoryGroupKey {
  return value === "food";
}

export function isFoodCategory(value: string | undefined): value is (typeof FOOD_CATEGORIES)[number] {
  return !!value && (FOOD_CATEGORIES as readonly string[]).includes(value);
}

/** Prisma `category` filter for a leaf category or the "food" group; undefined = no filter. */
export function productCategoryFilter(value: string | undefined) {
  if (isProductCategory(value)) return value;
  if (isProductCategoryGroup(value)) return { in: [...FOOD_CATEGORIES] };
  return undefined;
}

/** Icons for the food subcategory cards shown when the "food" card is open. */
export const FOOD_CATEGORY_ICON: Record<(typeof FOOD_CATEGORIES)[number], string> = {
  food_live: "/images/icons/subcategory-food-live.png",
  food_frozen: "/images/icons/subcategory-food-frozen.png",
  food_packaged: "/images/icons/subcategory-food-packaged.png",
};

export type ProductBrowseCategory = ProductCategoryValue | ProductCategoryGroupKey;

/** Top-level card buttons on /boutique, in display order — same icons as the home page. */
export const PRODUCT_BROWSE_CATEGORIES: { value: Exclude<ProductBrowseCategory, (typeof FOOD_CATEGORIES)[number]>; image: string }[] = [
  { value: "terrarium", image: "/images/icons/category-terrariums.png" },
  { value: "substrate", image: "/images/icons/category-substrates.png" },
  { value: "decor", image: "/images/icons/category-decor.png" },
  { value: "lighting", image: "/images/icons/category-lighting.png" },
  { value: "equipment", image: "/images/icons/category-equipment.png" },
  { value: "food", image: "/images/icons/category-food.png" },
  { value: "supplement", image: "/images/icons/category-supplement.png" },
];
