"use client";

export type VariantRow = {
  id?: string;
  labelFr: string;
  labelEn: string;
  sku: string;
  priceCAD: string;
  stockQty: string;
  cloverItemId: string;
};

export const EMPTY_VARIANT: VariantRow = {
  labelFr: "",
  labelEn: "",
  sku: "",
  priceCAD: "",
  stockQty: "0",
  cloverItemId: "",
};

const inputClass =
  "w-full rounded border border-black/20 px-2 py-1.5 text-sm dark:border-white/20 dark:bg-black";

/**
 * Editor for a product's size options (the storefront dropdown). Each row is
 * a sellable item with its own SKU, price and stock. State lives in the
 * parent form so it can also lock the product-level price/stock inputs.
 */
export function VariantsField({
  rows,
  onChange,
}: {
  rows: VariantRow[];
  onChange: (rows: VariantRow[]) => void;
}) {
  const update = (index: number, patch: Partial<VariantRow>) =>
    onChange(rows.map((row, i) => (i === index ? { ...row, ...patch } : row)));

  return (
    <fieldset className="flex flex-col gap-3 rounded border border-black/20 p-3 dark:border-white/20">
      <legend className="px-1 text-sm font-medium">Tailles / options (menu déroulant)</legend>
      <p className="text-xs text-zinc-500">
        Ex. Pinky, Fuzzy, Adulte… Chaque option a son propre SKU, prix et stock. Si vous ajoutez des
        options, le prix affiché est le plus bas et le stock est la somme des options.
      </p>

      <input type="hidden" name="variants" value={JSON.stringify(rows)} />

      {rows.map((row, index) => (
        <div
          key={row.id ?? `new-${index}`}
          className="grid grid-cols-2 gap-2 rounded border border-black/10 p-2 dark:border-white/10"
        >
          <label className="flex flex-col gap-1 text-xs">
            Nom (FR)
            <input
              value={row.labelFr}
              onChange={(e) => update(index, { labelFr: e.target.value })}
              required
              placeholder="Pinky 1-3g"
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            Nom (EN)
            <input
              value={row.labelEn}
              onChange={(e) => update(index, { labelEn: e.target.value })}
              placeholder="Pinky 1-3g"
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            SKU
            <input
              value={row.sku}
              onChange={(e) => update(index, { sku: e.target.value })}
              required
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            Prix (CAD)
            <input
              type="number"
              step="0.01"
              min="0"
              value={row.priceCAD}
              onChange={(e) => update(index, { priceCAD: e.target.value })}
              required
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            Stock
            <input
              type="number"
              min="0"
              value={row.stockQty}
              onChange={(e) => update(index, { stockQty: e.target.value })}
              required
              className={inputClass}
            />
          </label>
          <label className="flex flex-col gap-1 text-xs">
            Clover Item ID (optionnel)
            <input
              value={row.cloverItemId}
              onChange={(e) => update(index, { cloverItemId: e.target.value })}
              className={inputClass}
            />
          </label>
          <div className="col-span-2 flex justify-between">
            <span className="flex gap-3 text-xs">
              <button
                type="button"
                disabled={index === 0}
                onClick={() => {
                  const next = [...rows];
                  [next[index - 1], next[index]] = [next[index], next[index - 1]];
                  onChange(next);
                }}
                className="underline disabled:opacity-30"
              >
                ↑ Monter
              </button>
              <button
                type="button"
                disabled={index === rows.length - 1}
                onClick={() => {
                  const next = [...rows];
                  [next[index + 1], next[index]] = [next[index], next[index + 1]];
                  onChange(next);
                }}
                className="underline disabled:opacity-30"
              >
                ↓ Descendre
              </button>
            </span>
            <button
              type="button"
              onClick={() => onChange(rows.filter((_, i) => i !== index))}
              className="text-xs text-red-600 underline"
            >
              Retirer
            </button>
          </div>
        </div>
      ))}

      <button
        type="button"
        onClick={() => onChange([...rows, { ...EMPTY_VARIANT }])}
        className="w-fit rounded border border-black/20 px-3 py-1.5 text-sm dark:border-white/20"
      >
        + Ajouter une taille / option
      </button>
    </fieldset>
  );
}
