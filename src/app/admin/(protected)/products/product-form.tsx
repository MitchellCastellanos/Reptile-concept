"use client";

import { useState } from "react";
import type { Product } from "@/generated/prisma/client";
import { PhotoUploadField } from "@/components/admin/photo-upload-field";

const CATEGORY_OPTIONS = [
  "terrarium",
  "substrate",
  "decor",
  "food_live",
  "food_frozen",
  "food_packaged",
] as const;

export function ProductForm({
  product,
  action,
  prefill,
}: {
  product?: Product;
  action: (formData: FormData) => void;
  prefill?: { cloverItemId: string; suggestedName?: string; priceCAD?: number };
}) {
  const [imageUrl, setImageUrl] = useState(product?.imageUrl ?? "");

  return (
    <form action={action} className="flex max-w-lg flex-col gap-4">
      <PhotoUploadField
        name="imageUrl"
        label="Photo (téléversez un fichier ou collez une URL)"
        value={imageUrl}
        onChange={setImageUrl}
        placeholder="/images/products/TERRA-40G.jpg"
      />

      <label className="flex flex-col gap-1 text-sm">
        SKU
        <input
          name="sku"
          defaultValue={product?.sku}
          required
          className="rounded border border-black/20 px-3 py-2 dark:border-white/20 dark:bg-black"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Catégorie
        <select
          name="category"
          defaultValue={product?.category ?? "terrarium"}
          className="rounded border border-black/20 px-3 py-2 dark:border-white/20 dark:bg-black"
        >
          {CATEGORY_OPTIONS.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Nom (FR)
        <input
          name="nameFr"
          defaultValue={product?.nameFr ?? prefill?.suggestedName ?? ""}
          required
          className="rounded border border-black/20 px-3 py-2 dark:border-white/20 dark:bg-black"
        />
        {prefill ? (
          <span className="text-xs text-zinc-500">
            Suggéré à partir du nom de l&apos;article Clover — corrigez si besoin.
          </span>
        ) : null}
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Nom (EN)
        <input
          name="nameEn"
          defaultValue={product?.nameEn}
          required
          className="rounded border border-black/20 px-3 py-2 dark:border-white/20 dark:bg-black"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Prix (CAD)
        <input
          type="number"
          step="0.01"
          name="priceCAD"
          defaultValue={product ? Number(product.priceCAD) : prefill?.priceCAD}
          required
          className="rounded border border-black/20 px-3 py-2 dark:border-white/20 dark:bg-black"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Stock
        <input
          type="number"
          name="stockQty"
          defaultValue={product?.stockQty ?? 0}
          required
          className="rounded border border-black/20 px-3 py-2 dark:border-white/20 dark:bg-black"
        />
      </label>

      <label className="flex items-center gap-2 text-sm">
        <input
          type="checkbox"
          name="requiresColdChain"
          defaultChecked={product?.requiresColdChain}
        />
        Nécessite une chaîne du froid (aliment vivant/congelé)
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Clover Item ID (optionnel)
        <input
          name="cloverItemId"
          defaultValue={product?.cloverItemId ?? prefill?.cloverItemId ?? ""}
          readOnly={Boolean(prefill?.cloverItemId)}
          placeholder="ex. ABCD1234EFGH5"
          className="rounded border border-black/20 px-3 py-2 read-only:bg-black/5 dark:border-white/20 dark:bg-black dark:read-only:bg-white/5"
        />
        <span className="text-xs text-zinc-500">
          {prefill?.cloverItemId
            ? "Rempli automatiquement depuis la file d'import Clover."
            : "Reliez ce produit à sa fiche dans Clover pour que les ventes faites directement sur l'appareil Clover mettent automatiquement à jour le stock sur le site."}
        </span>
      </label>

      <button
        type="submit"
        className="w-fit rounded bg-foreground px-4 py-2 text-sm font-medium text-background"
      >
        Enregistrer
      </button>
    </form>
  );
}
