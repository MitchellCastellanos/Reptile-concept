"use client";

import { useActionState } from "react";
import { bulkIgnoreCategoryAction, bulkCreateProductsCategoryAction } from "./actions";

const PRODUCT_CATEGORY_OPTIONS = [
  "terrarium",
  "substrate",
  "decor",
  "food_live",
  "food_frozen",
  "food_packaged",
] as const;

// One row's worth of bulk actions for a whole Clover category at once —
// with a catalog in the thousands, reviewing item by item isn't realistic,
// so staff triage a Clover category in one click instead.
export function CategoryBulkActions({ cloverCategoryName }: { cloverCategoryName: string | null }) {
  const [ignoreState, ignoreAction, ignorePending] = useActionState(bulkIgnoreCategoryAction, undefined);
  const [createState, createAction, createPending] = useActionState(bulkCreateProductsCategoryAction, undefined);
  const key = cloverCategoryName ?? "__none__";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <form action={createAction} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="cloverCategoryName" value={key} />
        <select
          name="productCategory"
          required
          defaultValue=""
          className="rounded border border-black/20 px-2 py-1 text-xs dark:border-white/20 dark:bg-black"
        >
          <option value="" disabled>
            Catégorie du site...
          </option>
          {PRODUCT_CATEGORY_OPTIONS.map((c) => (
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
        <label className="flex items-center gap-1 whitespace-nowrap text-xs text-zinc-500">
          <input type="checkbox" name="remember" />
          Se souvenir pour les prochains articles
        </label>
      </form>

      <form action={ignoreAction} className="flex flex-wrap items-center gap-2">
        <input type="hidden" name="cloverCategoryName" value={key} />
        <button
          type="submit"
          disabled={ignorePending}
          className="whitespace-nowrap rounded border border-black/20 px-2 py-1 text-xs text-zinc-500 disabled:opacity-50 dark:border-white/20"
        >
          {ignorePending ? "..." : "Ignorer tout"}
        </button>
        <label className="flex items-center gap-1 whitespace-nowrap text-xs text-zinc-500">
          <input type="checkbox" name="remember" />
          Se souvenir
        </label>
      </form>

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
