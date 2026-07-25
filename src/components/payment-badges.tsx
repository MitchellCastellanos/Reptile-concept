"use client";

import { useTranslations } from "next-intl";
import { KlarnaWordmark } from "@/components/brand-marks";

// Klarna isn't wired up to a real processor yet (see checkout/actions.ts) —
// this badge promotes the payment option across the storefront ahead of
// connecting the merchant account.
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
        <KlarnaWordmark />
        {t("klarnaPromo")}
      </span>
    </div>
  );
}
