const UNSPLASH = "https://images.unsplash.com";

const speciesImages: Record<string, string> = {
  "seed-ball-python": `${UNSPLASH}/photo-1559251606-c623743a6ae9?w=600&h=450&fit=crop`,
  "seed-jackson-chameleon": `${UNSPLASH}/photo-1456926631375-92c8ceabdef4?w=600&h=450&fit=crop`,
  "seed-bearded-dragon": `${UNSPLASH}/photo-1585110396000-c9ffd4e4b308?w=600&h=450&fit=crop`,
  "seed-leopard-gecko": `${UNSPLASH}/photo-1612810655206-aec43d6b74e0?w=600&h=450&fit=crop`,
  "seed-corn-snake": `${UNSPLASH}/photo-1591876268377-5c6910ab0b62?w=600&h=450&fit=crop`,
  "seed-crested-gecko": `${UNSPLASH}/photo-1534188756822-dbf28bef2dad?w=600&h=450&fit=crop`,
};

const categoryImages: Record<string, string> = {
  terrarium: `${UNSPLASH}/photo-1598300042247-d088f8ab3a91?w=600&h=450&fit=crop`,
  substrate: `${UNSPLASH}/photo-1416879595882-3373a0480b5b?w=600&h=450&fit=crop`,
  decor: `${UNSPLASH}/photo-1466692479669-067af55c888b?w=600&h=450&fit=crop`,
  food_live: `${UNSPLASH}/photo-1605029428217-0b04e4e0e0e0?w=600&h=450&fit=crop`,
  food_frozen: `${UNSPLASH}/photo-1516467508483-a7212febe31a?w=600&h=450&fit=crop`,
  food_packaged: `${UNSPLASH}/photo-1583337130417-3346a1be90dd?w=600&h=450&fit=crop`,
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
  return categoryImages[category] ?? categoryImages.terrarium;
}
