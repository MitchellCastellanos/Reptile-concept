"use client";

import { useRef, useState, useTransition } from "react";
import { useLocale, useTranslations } from "next-intl";
import { useRouter } from "@/i18n/navigation";
import { useCart } from "@/lib/cart-context";
import { PaymentBadges } from "@/components/payment-badges";
import { KlarnaInstallments } from "@/components/klarna-installments";
import { PickupNotice } from "@/components/pickup-notice";
import { computeTax } from "@/lib/tax";
import { computeDiscount } from "@/lib/promo-math";
import { placeOrderAction, previewPromoAction } from "./actions";

type SavedAddress = {
  id: string;
  street: string;
  city: string;
  province: string;
  postalCode: string;
};

export function CheckoutForm({
  gstRatePercent,
  qstRatePercent,
  customer,
  addresses,
}: {
  gstRatePercent: number;
  qstRatePercent: number;
  customer: { fullName: string; email: string; phone: string | null } | null;
  addresses: SavedAddress[];
}) {
  const { items, totalCAD } = useCart();
  const t = useTranslations("Checkout");
  const tPickup = useTranslations("Pickup");
  const locale = useLocale();
  const router = useRouter();
  const [selectedAddressId, setSelectedAddressId] = useState<string>(addresses[0]?.id ?? "new");
  const emailRef = useRef<HTMLInputElement>(null);
  const [promoInput, setPromoInput] = useState("");
  const [promo, setPromo] = useState<{ code: string; percentOff: number } | null>(null);
  const [promoError, setPromoError] = useState<string | null>(null);
  const [applying, startApplying] = useTransition();

  if (items.length === 0) {
    if (typeof window !== "undefined") router.replace("/cart");
    return null;
  }

  const discountCAD = promo ? computeDiscount(totalCAD, promo.percentOff) : 0;
  const tax = computeTax(totalCAD - discountCAD, { gstRatePercent, qstRatePercent });

  function applyPromo() {
    setPromoError(null);
    setPromo(null);
    startApplying(async () => {
      try {
        const result = await previewPromoAction(
          promoInput,
          emailRef.current?.value ?? "",
          items.map((i) => ({ type: i.type, id: i.id, quantity: i.quantity })),
        );
        if (result.ok) setPromo({ code: result.code, percentOff: result.percentOff });
        else
          setPromoError(
            t(
              result.error === "expired"
                ? "promoExpired"
                : result.error === "alreadyUsed"
                  ? "promoAlreadyUsed"
                  : result.error === "notSubscribed"
                    ? "promoNotSubscribed"
                    : result.error === "emailRequired"
                      ? "promoEmailRequired"
                      : "promoInvalid",
            ),
          );
      } catch {
        setPromoError(t("promoInvalid"));
      }
    });
  }
  const usingSavedAddress = selectedAddressId !== "new";

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
        <div className="mt-3 flex flex-col gap-1 border-t border-border pt-3 text-sm text-muted">
          <p className="flex justify-between">
            <span>{t("subtotal")}</span>
            <span>{(tax.subtotalCAD + discountCAD).toFixed(2)} $</span>
          </p>
          {promo ? (
            <p className="flex justify-between">
              <span>
                {t("discount")} ({promo.code})
              </span>
              <span>-{discountCAD.toFixed(2)} $</span>
            </p>
          ) : null}
          <p className="flex justify-between">
            <span>{t("gst")}</span>
            <span>{tax.gstAmountCAD.toFixed(2)} $</span>
          </p>
          <p className="flex justify-between">
            <span>{t("qst")}</span>
            <span>{tax.qstAmountCAD.toFixed(2)} $</span>
          </p>
        </div>
        <p className="mt-2 font-medium">
          {t("total")}: {tax.totalCAD.toFixed(2)} $ CAD
        </p>
        <KlarnaInstallments priceCAD={tax.totalCAD} className="mt-1" />
      </section>

      <PickupNotice />

      <PaymentBadges />

      <form action={placeOrderAction} className="flex flex-col gap-4">
        <input type="hidden" name="cartJson" value={JSON.stringify(items)} />
        <input type="hidden" name="promoCode" value={promo?.code ?? ""} />

        <div className="flex flex-col gap-1 text-sm">
          <label htmlFor="promoInput">{t("promoLabel")}</label>
          <div className="flex gap-2">
            <input
              id="promoInput"
              value={promoInput}
              onChange={(e) => setPromoInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  if (promoInput.trim()) applyPromo();
                }
              }}
              autoCapitalize="characters"
              className="flex-1 rounded-lg border border-border bg-background px-3 py-2 uppercase"
            />
            <button
              type="button"
              onClick={applyPromo}
              disabled={applying || !promoInput.trim()}
              className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-accent-light disabled:opacity-50"
            >
              {t("promoApply")}
            </button>
          </div>
          {promo ? (
            <p className="text-green-700 dark:text-green-400">
              {t("promoApplied", { percent: promo.percentOff })}
            </p>
          ) : null}
          {promoError ? <p className="text-red-600 dark:text-red-400">{promoError}</p> : null}
        </div>

        <label className="flex flex-col gap-1 text-sm">
          {t("fullName")}
          <input
            name="fullName"
            required
            defaultValue={customer?.fullName}
            className="rounded-lg border border-border bg-background px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          Email
          <input
            ref={emailRef}
            type="email"
            name="email"
            required
            defaultValue={customer?.email}
            className="rounded-lg border border-border bg-background px-3 py-2"
          />
        </label>
        <label className="flex flex-col gap-1 text-sm">
          {t("phone")}
          <input
            name="phone"
            defaultValue={customer?.phone ?? ""}
            className="rounded-lg border border-border bg-background px-3 py-2"
          />
        </label>

        <p className="text-xs text-muted">{tPickup("addressHelp")}</p>

        {addresses.length > 0 ? (
          <div className="flex flex-col gap-2 rounded-lg border border-border bg-accent-light p-3">
            <p className="text-sm font-medium text-foreground">{t("savedAddresses")}</p>
            {addresses.map((address) => (
              <label key={address.id} className="flex items-center gap-2 text-sm">
                <input
                  type="radio"
                  name="addressChoice"
                  checked={selectedAddressId === address.id}
                  onChange={() => setSelectedAddressId(address.id)}
                />
                {address.street}, {address.city}, {address.province} {address.postalCode}
              </label>
            ))}
            <label className="flex items-center gap-2 text-sm">
              <input
                type="radio"
                name="addressChoice"
                checked={selectedAddressId === "new"}
                onChange={() => setSelectedAddressId("new")}
              />
              {t("useNewAddress")}
            </label>
          </div>
        ) : null}

        {usingSavedAddress ? (
          <input type="hidden" name="addressId" value={selectedAddressId} />
        ) : (
          <>
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
          </>
        )}
        <input type="hidden" name="preferredLang" value={locale} />

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
