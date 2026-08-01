const UNSPLASH = "https://images.unsplash.com";

const speciesImages: Record<string, string> = {
  "seed-ball-python": `${UNSPLASH}/photo-1559251606-c623743a6ae9?w=600&h=450&fit=crop`,
  "seed-jackson-chameleon": `${UNSPLASH}/photo-1456926631375-92c8ceabdef4?w=600&h=450&fit=crop`,
  "seed-bearded-dragon": `${UNSPLASH}/photo-1585110396000-c9ffd4e4b308?w=600&h=450&fit=crop`,
  "seed-leopard-gecko": `${UNSPLASH}/photo-1612810655206-aec43d6b74e0?w=600&h=450&fit=crop`,
  "seed-corn-snake": `${UNSPLASH}/photo-1591876268377-5c6910ab0b62?w=600&h=450&fit=crop`,
  "seed-crested-gecko": `${UNSPLASH}/photo-1534188756822-dbf28bef2dad?w=600&h=450&fit=crop`,
};

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
  speciesId: string,
  media?: { url: string }[],
): string {
  if (media?.[0]?.url) return media[0].url;
  return speciesImages[speciesId] ?? animalPlaceholderImage;
}

export function getProductImageUrl(category: string): string {
  return categoryImages[category] ?? productDefaultImages.terrarium;
}
