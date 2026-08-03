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

export const animalPlaceholderImage = "/images/animal-placeholder.png";

export function getAnimalImageUrl(
  _speciesId: string,
  media?: { url: string }[],
): string {
  if (media?.[0]?.url) return media[0].url;
  return animalPlaceholderImage;
}

export function getProductImageUrl(category: string): string {
  return categoryImages[category] ?? productDefaultImages.terrarium;
}
