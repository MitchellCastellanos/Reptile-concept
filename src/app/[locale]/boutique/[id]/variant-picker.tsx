"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { AddProductToCartButton } from "@/components/add-to-cart-button";
import { KlarnaInstallments } from "@/components/klarna-installments";
import { NotifyMeForm } from "./notify-me-form";

export type PickerVariant = {
  id: string;
  label: string;
  /** Full product name ("Frozen mouse — Pinky") used for the cart line. */
  name: string;
  priceCAD: number;
  stockQty: number;
};

/**
 * Size dropdown for a product with variants. Price, stock and the add-to-cart
 * button all follow the selected option; each option is a real product, so
 * the cart and checkout need no special handling.
 */
export function VariantPicker({ variants }: { variants: PickerVariant[] }) {
  const t = useTranslations("Boutique");
  const [selectedId, setSelectedId] = useState(
    () => (variants.find((v) => v.stockQty > 0) ?? variants[0]).id,
  );
  const selected = variants.find((v) => v.id === selectedId) ?? variants[0];

  return (
    <>
      <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
        {t("sizeLabel")}
        <select
          value={selected.id}
          onChange={(e) => setSelectedId(e.target.value)}
          className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm font-normal"
        >
          {variants.map((v) => (
            <option key={v.id} value={v.id}>
              {v.label}
              {v.stockQty <= 0 ? ` — ${t("outOfStock")}` : ""}
            </option>
          ))}
        </select>
      </label>

      <div>
        <p className="text-2xl font-bold text-primary">{selected.priceCAD} $ CAD</p>
        <KlarnaInstallments priceCAD={selected.priceCAD} className="mt-1" />
      </div>

      <p className="text-sm font-medium text-muted">
        {selected.stockQty > 0 ? t("inStock") : t("outOfStock")}
      </p>

      {selected.stockQty > 0 ? (
        <AddProductToCartButton
          key={selected.id}
          id={selected.id}
          name={selected.name}
          priceCAD={selected.priceCAD}
          stockQty={selected.stockQty}
        />
      ) : (
        <NotifyMeForm key={selected.id} productId={selected.id} />
      )}
    </>
  );
}
