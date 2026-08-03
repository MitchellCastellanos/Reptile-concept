import type { Species } from "@/generated/prisma/client";
import { isCloverPlaceholderSpeciesId } from "@/lib/admin-catalog-counts";
import { isCareSheetIncomplete } from "@/lib/species-utils";

export function speciesNeedsAttention(
  species: Pick<Species, "id" | "descriptionEn" | "humidity" | "adultSizeEn">,
) {
  if (isCloverPlaceholderSpeciesId(species.id)) return false;
  return isCareSheetIncomplete(species);
}

export function animalNeedsAttention(animal: {
  speciesId: string;
  species: Pick<Species, "id" | "descriptionEn" | "humidity" | "adultSizeEn">;
}) {
  return isCloverPlaceholderSpeciesId(animal.speciesId) || isCareSheetIncomplete(animal.species);
}

export function productNeedsAttention(product: { published: boolean; stockQty: number }) {
  return !product.published && product.stockQty > 0;
}

export type CatalogAlertKind = "species" | "animals" | "products";

export const CATALOG_ALERT_COPY: Record<
  CatalogAlertKind,
  { title: string; body: string; action: string }
> = {
  species: {
    title: "Fiches d'espèce incomplètes",
    body: "Complétez la description, l'humidité et la taille adulte (EN) via Modifier, ou utilisez l'assistant ChatGPT sur la page d'édition. Sans fiche complète, les visiteurs ne voient pas les conseils de maintenance sur les fiches animal.",
    action: "Ouvrir l'espèce → onglet fiche de soins → coller la réponse ChatGPT ou remplir manuellement.",
  },
  animals: {
    title: "Animaux nécessitant une attention",
    body: "Ces animaux sont liés à une espèce placeholder Clover ou à une espèce dont la fiche de soins est incomplète. Assignez la bonne espèce dans Modifier, ou complétez d'abord la fiche espèce correspondante.",
    action: "Modifier l'animal → choisir l'espèce correcte. Si l'espèce n'existe pas, créez-la sous Espèces avec une fiche complète.",
  },
  products: {
    title: "Produits en stock mais non publiés",
    body: "Ces articles ont du stock mais ne sont pas visibles dans la boutique en ligne. Publiez-les ou mettez le stock à zéro s'ils ne doivent pas être vendus en ligne.",
    action: "Modifier le produit → cocher « Publié » pour l'afficher sur /boutique.",
  },
};
