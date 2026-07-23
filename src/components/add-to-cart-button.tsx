"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useCart } from "@/lib/cart-context";

const btnPrimary =
  "w-fit rounded-full bg-primary px-5 py-3 text-sm font-medium text-white transition hover:bg-primary-light";
const btnSecondary =
  "w-fit rounded-full border border-primary px-4 py-2 text-xs font-medium text-primary transition hover:bg-primary/5";

export function AddAnimalToCartButton({
  id,
  name,
  priceCAD,
}: {
  id: string;
  name: string;
  priceCAD: number;
}) {
  const { addAnimal } = useCart();
  const router = useRouter();
  const t = useTranslations("Cart");

  return (
    <button
      type="button"
      onClick={() => {
        addAnimal(id, name, priceCAD);
        router.push("/cart");
      }}
      className={btnPrimary}
    >
      {t("reserve")}
    </button>
  );
}

export function AddProductToCartButton({
  id,
  name,
  priceCAD,
  stockQty,
}: {
  id: string;
  name: string;
  priceCAD: number;
  stockQty: number;
}) {
  const { addProduct } = useCart();
  const t = useTranslations("Cart");
  const [quantity, setQuantity] = useState(1);

  if (stockQty <= 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-2">
      <div className="flex items-center rounded-full border border-border">
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            setQuantity((q) => Math.max(1, q - 1));
          }}
          disabled={quantity <= 1}
          aria-label="-"
          className="px-3 py-1.5 text-sm font-medium text-foreground disabled:opacity-30"
        >
          −
        </button>
        <span className="w-6 text-center text-sm font-medium tabular-nums">{quantity}</span>
        <button
          type="button"
          onClick={(e) => {
            e.preventDefault();
            setQuantity((q) => Math.min(stockQty, q + 1));
          }}
          disabled={quantity >= stockQty}
          aria-label="+"
          className="px-3 py-1.5 text-sm font-medium text-foreground disabled:opacity-30"
        >
          +
        </button>
      </div>
      <button
        type="button"
        onClick={(e) => {
          e.preventDefault();
          addProduct(id, name, priceCAD, quantity, stockQty);
          setQuantity(1);
        }}
        className={btnSecondary}
      >
        {t("addToCart")}
      </button>
    </div>
  );
}
