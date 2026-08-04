import { isAnimalCategory, type AnimalCategoryValue } from "@/lib/animal-categories";

const productDefaultImages = {
  terrarium: "/images/products/default-terrarium.jpg",
  substrate: "/images/products/default-substrate.jpg",
  decor: "/images/products/default-decor.jpg",
  hardware: "/images/products/default-hardware.jpg",
  consumables: "/images/products/default-consumables.jpg",
} as const;

const categoryImages: Record<string, string> = {
  terrarium: productDefaultImages.terrarium,
  substrate: productDefaultImages.substrate,
  decor: productDefaultImages.decor,
  lighting: productDefaultImages.hardware,
  equipment: productDefaultImages.hardware,
  food_live: productDefaultImages.consumables,
  food_frozen: productDefaultImages.consumables,
  food_packaged: productDefaultImages.consumables,
  supplement: productDefaultImages.consumables,
};

const animalCategoryDefaultImages: Record<AnimalCategoryValue, string> = {
  reptiles_snakes: "/images/animals/defaults/reptiles-snakes.png",
  reptiles_geckos: "/images/animals/defaults/reptiles-geckos.jpg",
  reptiles_lizards: "/images/animals/defaults/reptiles-lizards.png",
  reptiles_turtles: "/images/animals/defaults/reptiles-turtles.png",
  reptiles_other: "/images/animals/defaults/reptiles-geckos.jpg",
  amphibians_frogs: "/images/animals/defaults/amphibians.png",
  amphibians_salamanders: "/images/animals/defaults/amphibians-salamanders.png",
  amphibians_other: "/images/animals/defaults/amphibians.png",
  invertebrates_arachnids: "/images/animals/defaults/invertebrates.png",
  invertebrates_insects: "/images/animals/defaults/invertebrates.png",
  invertebrates_other: "/images/animals/defaults/invertebrates.png",
};

export const animalPlaceholderImage = "/images/animals/defaults/reptiles-geckos.jpg";

export function getAnimalImageUrl(
  category: string,
  media?: { url: string }[],
): string {
  if (media?.[0]?.url) return media[0].url;
  if (isAnimalCategory(category)) return animalCategoryDefaultImages[category];
  return animalPlaceholderImage;
}

export function getProductImageUrl(category: string): string {
  return categoryImages[category] ?? productDefaultImages.terrarium;
}
