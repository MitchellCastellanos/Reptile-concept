"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useCart } from "@/lib/cart-context";

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
      className="w-fit rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background"
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
    <button
      type="button"
      onClick={() => addProduct(id, name, priceCAD, stockQty)}
      className="mt-2 w-fit rounded-full border border-black/20 px-4 py-2 text-xs font-medium dark:border-white/20"
    >
      {t("addToCart")}
    </button>
  );
}
