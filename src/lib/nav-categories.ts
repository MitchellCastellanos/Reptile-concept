// Static navigation taxonomy for the site menu. Animal subcategory links are
// placeholders (no `category` query filtering yet) until Species/Animal gets
// a real taxonomy field — see the "sin categorias / expand nav" discussion.
// Boutique subcategory links map 1:1 to the ProductCategory enum and filter
// for real via `getProducts(category)`.

export type NavLeaf = { key: string; href: string };
export type NavSection = { key: string; items: NavLeaf[] };

export type NavTopItem = {
  key: "home" | "animals" | "boutique" | "reviews";
  href: string;
  viewAllKey?: string;
  sections?: NavSection[];
  items?: NavLeaf[];
};

export const NAV_ITEMS: NavTopItem[] = [
  { key: "home", href: "/" },
  {
    key: "animals",
    href: "/animals",
    viewAllKey: "viewAllAnimals",
    sections: [
      {
        key: "reptiles",
        items: [
          { key: "reptiles_snakes", href: "/animals" },
          { key: "reptiles_lizards", href: "/animals" },
          { key: "reptiles_turtles", href: "/animals" },
          { key: "reptiles_other", href: "/animals" },
        ],
      },
      {
        key: "amphibians",
        items: [
          { key: "amphibians_frogs", href: "/animals" },
          { key: "amphibians_salamanders", href: "/animals" },
          { key: "amphibians_other", href: "/animals" },
        ],
      },
    ],
  },
  {
    key: "boutique",
    href: "/boutique",
    viewAllKey: "viewAllProducts",
    items: [
      { key: "terrarium", href: "/boutique?category=terrarium" },
      { key: "substrate", href: "/boutique?category=substrate" },
      { key: "decor", href: "/boutique?category=decor" },
      { key: "lighting", href: "/boutique?category=lighting" },
      { key: "equipment", href: "/boutique?category=equipment" },
      { key: "food_live", href: "/boutique?category=food_live" },
      { key: "food_frozen", href: "/boutique?category=food_frozen" },
      { key: "food_packaged", href: "/boutique?category=food_packaged" },
      { key: "supplement", href: "/boutique?category=supplement" },
    ],
  },
  { key: "reviews", href: "/reviews" },
];
