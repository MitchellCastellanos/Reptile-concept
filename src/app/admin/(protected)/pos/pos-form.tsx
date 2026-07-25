"use client";

import { useEffect, useMemo, useState, useActionState } from "react";
import { recordPosSaleAction } from "./actions";

type AnimalOption = { id: string; label: string; priceCAD: number };
type ProductOption = { id: string; label: string; priceCAD: number; stockQty: number };

type SaleLine = {
  type: "animal" | "product";
  id: string;
  label: string;
  priceCAD: number;
  quantity: number;
  maxQuantity?: number;
};

export function PosForm({
  animals,
  products,
}: {
  animals: AnimalOption[];
  products: ProductOption[];
}) {
  const [lines, setLines] = useState<SaleLine[]>([]);
  const [state, formAction, pending] = useActionState(recordPosSaleAction, undefined);

  const total = useMemo(() => lines.reduce((sum, l) => sum + l.priceCAD * l.quantity, 0), [lines]);

  useEffect(() => {
    if (state?.success) setLines([]);
  }, [state]);

  function addAnimal(id: string) {
    const animal = animals.find((a) => a.id === id);
    if (!animal || lines.some((l) => l.type === "animal" && l.id === id)) return;
    setLines((prev) => [...prev, { type: "animal", id, label: animal.label, priceCAD: animal.priceCAD, quantity: 1 }]);
  }

  function addProduct(id: string) {
    const product = products.find((p) => p.id === id);
    if (!product) return;
    setLines((prev) => {
      const existing = prev.find((l) => l.type === "product" && l.id === id);
      if (existing) {
        return prev.map((l) =>
          l.type === "product" && l.id === id
            ? { ...l, quantity: Math.min(l.quantity + 1, product.stockQty) }
            : l,
        );
      }
      return [
        ...prev,
        { type: "product", id, label: product.label, priceCAD: product.priceCAD, quantity: 1, maxQuantity: product.stockQty },
      ];
    });
  }

  function removeLine(type: "animal" | "product", id: string) {
    setLines((prev) => prev.filter((l) => !(l.type === type && l.id === id)));
  }

  return (
    <div className="flex max-w-2xl flex-col gap-6">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <label className="flex flex-col gap-1 text-sm">
          Ajouter un animal
          <select
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) addAnimal(e.target.value);
              e.target.value = "";
            }}
            className="rounded border border-black/20 px-3 py-2 dark:border-white/20 dark:bg-black"
          >
            <option value="" disabled>
              Choisir...
            </option>
            {animals.map((a) => (
              <option key={a.id} value={a.id}>
                {a.label} — {a.priceCAD} $
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Ajouter un produit
          <select
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) addProduct(e.target.value);
              e.target.value = "";
            }}
            className="rounded border border-black/20 px-3 py-2 dark:border-white/20 dark:bg-black"
          >
            <option value="" disabled>
              Choisir...
            </option>
            {products.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label} — {p.priceCAD} $ ({p.stockQty} en stock)
              </option>
            ))}
          </select>
        </label>
      </div>

      {lines.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {lines.map((line) => (
            <li
              key={`${line.type}-${line.id}`}
              className="flex items-center justify-between rounded border border-black/10 px-3 py-2 text-sm dark:border-white/10"
            >
              <span>
                {line.label} {line.type === "product" ? `× ${line.quantity}` : ""} —{" "}
                {(line.priceCAD * line.quantity).toFixed(2)} $
              </span>
              <button
                type="button"
                onClick={() => removeLine(line.type, line.id)}
                className="text-red-600 underline dark:text-red-400"
              >
                Retirer
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-zinc-500">Aucun article ajouté.</p>
      )}

      <p className="text-lg font-semibold">Total : {total.toFixed(2)} $ CAD</p>

      <form action={formAction} className="flex flex-col gap-4">
        <input type="hidden" name="cartJson" value={JSON.stringify(lines)} />
        <fieldset className="flex gap-6 text-sm">
          <label className="flex items-center gap-2">
            <input type="radio" name="paymentMethod" value="cash" defaultChecked /> Comptant
          </label>
          <label className="flex items-center gap-2">
            <input type="radio" name="paymentMethod" value="card" /> Carte (terminal Clover)
          </label>
        </fieldset>

        {state?.error ? <p className="text-sm text-red-600 dark:text-red-400">{state.error}</p> : null}
        {state?.success ? (
          <p className="text-sm text-green-700 dark:text-green-400">Vente enregistrée avec succès.</p>
        ) : null}

        <button
          type="submit"
          disabled={pending || lines.length === 0}
          className="w-fit rounded bg-foreground px-5 py-3 text-sm font-medium text-background disabled:opacity-50"
        >
          {pending ? "Traitement..." : "Enregistrer la vente"}
        </button>
      </form>
    </div>
  );
}
