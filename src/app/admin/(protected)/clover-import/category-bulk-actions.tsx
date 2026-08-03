"use client";

import { useActionState } from "react";
import { bulkIgnoreCategoryAction, bulkCreateProductsCategoryAction, bulkCreateAnimalsCategoryAction } from "./actions";
import { PRODUCT_CATEGORIES } from "@/lib/product-categories";
import {
  looksLikeAnimalCategory,
  looksLikeLiveFoodCategory,
  isMixedInvertebrateCloverCategory,
  suggestProductCategory,
} from "@/lib/clover-category-mapping";

export function CategoryBulkActions({ cloverCategoryName }: { cloverCategoryName: string | null }) {
  const [ignoreState, ignoreAction, ignorePending] = useActionState(bulkIgnoreCategoryAction, undefined);
  const [createState, createAction, createPending] = useActionState(bulkCreateProductsCategoryAction, undefined);
  const [animalState, animalAction, animalPending] = useActionState(bulkCreateAnimalsCategoryAction, undefined);
  const key = cloverCategoryName ?? "__none__";
  const isAnimalCategory = looksLikeAnimalCategory(cloverCategoryName);
  const isLiveFood = looksLikeLiveFoodCategory(cloverCategoryName);
  const isMixedInvertebrate = isMixedInvertebrateCloverCategory(cloverCategoryName);
  const suggested = suggestProductCategory(cloverCategoryName);

  return (
    <div className="flex flex-wrap items-center gap-2">
      {isAnimalCategory ? (
        <>
          <form action={animalAction} className="flex flex-wrap items-center gap-2">
            <input type="hidden" name="cloverCategoryName" value={key} />
            <button
              type="submit"
              disabled={animalPending}
              className="whitespace-nowrap rounded border border-black/20 px-2 py-1 text-xs font-medium disabled:opacity-50 dark:border-white/20"
            >
              {animalPending ? "..." : "Créer tout comme animaux"}
            </button>
          </form>
          <span className="whitespace-nowrap text-xs text-zinc-500">
            Les nouveaux articles Clover de cette catégorie iront automatiquement aux animaux.
          </span>
        </>
      ) : isMixedInvertebrate ? (
        <span className="whitespace-nowrap text-xs text-amber-700 dark:text-amber-500">
          Catégorie mixte — isopodes → nourriture vivante auto ; araignées → animaux auto ; le reste un par un.
        </span>
      ) : (
        <form action={createAction} className="flex flex-wrap items-center gap-2">
          <input type="hidden" name="cloverCategoryName" value={key} />
          <select
            name="productCategory"
            required
            defaultValue={suggested ?? ""}
            className="rounded border border-black/20 px-2 py-1 text-xs dark:border-white/20 dark:bg-black"
          >
            <option value="" disabled>
              Catégorie du site...
            </option>
            {PRODUCT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
          <button
            type="submit"
            disabled={createPending}
            className="whitespace-nowrap rounded border border-black/20 px-2 py-1 text-xs font-medium disabled:opacity-50 dark:border-white/20"
          >
            {createPending ? "..." : "Créer tout comme produits"}
          </button>
          {isLiveFood ? (
            <span className="whitespace-nowrap text-xs text-zinc-500">
              Nouveaux articles → produit auto ({suggested ?? "food_live"}).
            </span>
          ) : (
            <label className="flex items-center gap-1 whitespace-nowrap text-xs text-zinc-500">
              <input type="checkbox" name="remember" />
              Se souvenir pour les prochains articles
            </label>
          )}
        </form>
      )}

      <form action={ignoreAction} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="cloverCategoryName" value={key} />
        <button
          type="submit"
          disabled={ignorePending}
          className="whitespace-nowrap rounded border border-black/20 px-2 py-1 text-xs text-zinc-500 disabled:opacity-50 dark:border-white/20"
        >
          {ignorePending ? "..." : "Ignorer tout"}
        </button>
        {!isLiveFood && !isMixedInvertebrate ? (
          <label className="flex items-center gap-1 whitespace-nowrap text-xs text-zinc-500">
            <input type="checkbox" name="remember" />
            Se souvenir
          </label>
        ) : null}
      </form>

      {animalState?.error ? <span className="text-xs text-red-600 dark:text-red-400">{animalState.error}</span> : null}
      {animalState?.created != null ? (
        <span className="text-xs text-green-700 dark:text-green-400">
          {animalState.created} animal(aux) créé(s)
          {animalState.skipped ? `, ${animalState.skipped} ignoré(s) (erreur)` : ""}
        </span>
      ) : null}
      {createState?.error ? <span className="text-xs text-red-600 dark:text-red-400">{createState.error}</span> : null}
      {createState?.created != null ? (
        <span className="text-xs text-green-700 dark:text-green-400">
          {createState.created} créé(s){createState.skipped ? `, ${createState.skipped} ignoré(s) (erreur)` : ""}
        </span>
      ) : null}
      {ignoreState?.ignored != null ? (
        <span className="text-xs text-zinc-500">{ignoreState.ignored} ignoré(s)</span>
      ) : null}
    </div>
  );
}
