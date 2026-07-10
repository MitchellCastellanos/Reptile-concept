"use client";

import { useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useCart } from "@/lib/cart-context";
import { placeOrderAction } from "./actions";

export default function CheckoutPage() {
  const { items, totalCAD } = useCart();
  const t = useTranslations("Checkout");
  const router = useRouter();

  if (items.length === 0) {
    if (typeof window !== "undefined") router.replace("/cart");
    return null;
  }

  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-6 py-12">
      <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>

      <section className="rounded-2xl border border-border bg-card p-4 shadow-sm">
        <ul className="flex flex-col gap-1 text-sm">
          {items.map((item) => (
            <li key={`${item.type}-${item.id}`}>
              {item.name} {item.type === "product" ? `× ${item.quantity}` : ""} —{" "}
              {(item.priceCAD * item.quantity).toFixed(2)} $
            </li>
          ))}
        </ul>
        <p className="mt-2 font-medium">
          {t("total")}: {totalCAD.toFixed(2)} $ CAD
        </p>
      </section>

      <form action={placeOrderAction} className="flex flex-col gap-4">
        <input type="hidden" name="cartJson" value={JSON.stringify(items)} />

        <label className="flex flex-col gap-1 text-sm">
          {t("fullName")}
          <input
            name="fullName"
            required
            className="rounded-lg border border-border bg-background px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Email
          <input
            type="email"
            name="email"
            required
            className="rounded-lg border border-border bg-background px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {t("phone")}
          <input
            name="phone"
            className="rounded-lg border border-border bg-background px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {t("street")}
          <input
            name="street"
            required
            className="rounded-lg border border-border bg-background px-3 py-2"
          />
        </label>
        <div className="grid grid-cols-3 gap-4">
          <label className="flex flex-col gap-1 text-sm">
            {t("city")}
            <input
              name="city"
              required
              className="rounded-lg border border-border bg-background px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {t("province")}
            <input
              name="province"
              required
              defaultValue="QC"
              className="rounded-lg border border-border bg-background px-3 py-2"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            {t("postalCode")}
            <input
              name="postalCode"
              required
              className="rounded-lg border border-border bg-background px-3 py-2"
            />
          </label>
        </div>
        <input type="hidden" name="preferredLang" value="fr" />

        <label className="flex items-start gap-2 text-sm">
          <input type="checkbox" name="healthGuaranteeAccepted" required className="mt-1" />
          <span>{t("healthGuarantee")}</span>
        </label>

        <button
          type="submit"
          className="w-fit rounded-full bg-primary px-5 py-3 text-sm font-medium text-white hover:bg-primary-light"
        >
          {t("placeOrder")}
        </button>
      </form>
    </main>
  );
}
