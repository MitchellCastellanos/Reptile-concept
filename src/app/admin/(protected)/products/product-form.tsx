import type { Product } from "@/generated/prisma/client";

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
}: {
  product?: Product;
  action: (formData: FormData) => void;
}) {
  return (
    <form action={action} className="flex max-w-lg flex-col gap-4">
      <label className="flex flex-col gap-1 text-sm">
        SKU
        <input
          name="sku"
          defaultValue={product?.sku}
          required
          className="admin-input"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Catégorie
        <select
          name="category"
          defaultValue={product?.category ?? "terrarium"}
          className="admin-input"
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
          defaultValue={product?.nameFr}
          required
          className="admin-input"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Nom (EN)
        <input
          name="nameEn"
          defaultValue={product?.nameEn}
          required
          className="admin-input"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Prix (CAD)
        <input
          type="number"
          step="0.01"
          name="priceCAD"
          defaultValue={product ? Number(product.priceCAD) : undefined}
          required
          className="admin-input"
        />
      </label>

      <label className="flex flex-col gap-1 text-sm">
        Stock
        <input
          type="number"
          name="stockQty"
          defaultValue={product?.stockQty ?? 0}
          required
          className="admin-input"
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

      <button
        type="submit"
        className="w-fit rounded bg-foreground px-4 py-2 text-sm font-medium text-background"
      >
        Enregistrer
      </button>
    </form>
  );
}
