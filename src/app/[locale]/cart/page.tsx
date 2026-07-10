"use client";

import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCart } from "@/lib/cart-context";

export default function CartPage() {
  const { items, removeItem, setProductQuantity, totalCAD } = useCart();
  const t = useTranslations("Cart");

  if (items.length === 0) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-12">
        <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>
        <p className="text-zinc-600 dark:text-zinc-400">{t("empty")}</p>
        <Link href="/animals" className="w-fit underline">
          {t("continueShopping")}
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-12">
      <h1 className="text-3xl font-semibold tracking-tight">{t("title")}</h1>

      <ul className="flex flex-col gap-4">
        {items.map((item) => (
          <li
            key={`${item.type}-${item.id}`}
            className="flex items-center justify-between gap-4 rounded-lg border border-black/10 p-4 dark:border-white/10"
          >
            <div>
              <p className="font-medium">{item.name}</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                {item.priceCAD} $ CAD {item.type === "product" ? `× ${item.quantity}` : ""}
              </p>
            </div>
            <div className="flex items-center gap-3">
              {item.type === "product" ? (
                <input
                  type="number"
                  min={1}
                  max={item.maxQuantity}
                  value={item.quantity}
                  onChange={(e) => setProductQuantity(item.id, Number(e.target.value))}
                  className="w-16 rounded border border-black/20 px-2 py-1 text-sm dark:border-white/20 dark:bg-black"
                />
              ) : null}
              <button
                type="button"
                onClick={() => removeItem(item.type, item.id)}
                className="text-sm text-red-600 underline dark:text-red-400"
              >
                {t("remove")}
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between border-t border-black/10 pt-4 dark:border-white/10">
        <span className="font-medium">{t("total")}</span>
        <span className="text-lg font-semibold">{totalCAD.toFixed(2)} $ CAD</span>
      </div>

      <Link
        href="/checkout"
        className="w-fit rounded-full bg-foreground px-5 py-3 text-sm font-medium text-background"
      >
        {t("checkout")}
      </Link>
    </main>
  );
}
