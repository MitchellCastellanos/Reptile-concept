"use client";

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

  if (stockQty <= 0) return null;

  return (
    <button type="button" onClick={() => addProduct(id, name, priceCAD, stockQty)} className={btnSecondary}>
      {t("addToCart")}
    </button>
  );
}
