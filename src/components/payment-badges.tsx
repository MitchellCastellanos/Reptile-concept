"use client";

import { useTranslations } from "next-intl";
import { StripeMark, KlarnaWordmark } from "@/components/brand-marks";

// Stripe + Klarna aren't wired up to a real processor yet (see
// checkout/actions.ts) — these badges promote the payment options across the
// storefront ahead of connecting the merchant accounts.
export function PaymentBadges({
  className = "",
  variant = "light",
}: {
  className?: string;
  variant?: "light" | "onDark";
}) {
  const t = useTranslations("Payments");
  const badgeClass =
    variant === "onDark"
      ? "inline-flex items-center gap-2 rounded-full border border-white/30 bg-white/10 px-3 py-1.5 text-xs font-medium text-white"
      : "inline-flex items-center gap-2 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted";

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <span className={badgeClass}>
        <StripeMark />
        {t("securePayment")}
      </span>
      <span className={badgeClass}>
        <KlarnaWordmark />
        {t("klarnaPromo")}
      </span>
    </div>
  );
}
