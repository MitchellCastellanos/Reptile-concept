"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCart } from "@/lib/cart-context";
import { PaymentBadges } from "@/components/payment-badges";

export default function CartPage() {
  const { items, removeItem, setProductQuantity, totalCAD } = useCart();
  const t = useTranslations("Cart");

  if (items.length === 0) {
    return (
      <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center gap-6 px-6 py-16 text-center">
        <Image src="/images/empty-cart.png" alt="" width={200} height={200} className="h-48 w-48" />
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted">{t("empty")}</p>
        <Link
          href="/animals"
          className="rounded-full bg-primary px-5 py-3 text-sm font-medium text-white hover:bg-primary-light"
        >
          {t("continueShopping")}
        </Link>
      </main>
    );
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 px-6 py-12">
      <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>

      <ul className="flex flex-col gap-4">
        {items.map((item) => (
          <li
            key={`${item.type}-${item.id}`}
            className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-card p-4 shadow-sm"
          >
            <div>
              <p className="font-semibold">{item.name}</p>
              <p className="text-sm text-muted">
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
                  className="w-16 rounded-lg border border-border bg-background px-2 py-1 text-sm"
                />
              ) : null}
              <button
                type="button"
                onClick={() => removeItem(item.type, item.id)}
                className="text-sm text-red-600 hover:underline"
              >
                {t("remove")}
              </button>
            </div>
          </li>
        ))}
      </ul>

      <div className="flex items-center justify-between border-t border-border pt-4">
        <span className="font-medium">{t("total")}</span>
        <span className="text-lg font-bold text-primary">{totalCAD.toFixed(2)} $ CAD</span>
      </div>

      <Link
        href="/checkout"
        className="w-fit rounded-full bg-primary px-5 py-3 text-sm font-medium text-white hover:bg-primary-light"
      >
        {t("checkout")}
      </Link>

      <PaymentBadges />
    </main>
  );
}
