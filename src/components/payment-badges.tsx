"use client";

import { useTranslations } from "next-intl";

// Stripe + Klarna aren't wired up yet (see checkout/actions.ts) — these badges
// promote the upcoming payment options across the storefront ahead of launch.
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
      ? "inline-flex items-center gap-1.5 rounded-full border border-white/30 bg-white/10 px-3 py-1.5 text-xs font-medium text-white"
      : "inline-flex items-center gap-1.5 rounded-full border border-border bg-card px-3 py-1.5 text-xs font-medium text-muted";

  return (
    <div className={`flex flex-wrap items-center gap-2 ${className}`}>
      <span className={badgeClass}>
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="2" y="5" width="20" height="14" rx="2" />
          <path d="M2 10h20" />
        </svg>
        {t("stripeSoon")}
      </span>
      <span className={badgeClass}>
        <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M12 2 3 7v10l9 5 9-5V7z" />
          <path d="M12 12v9" />
          <path d="m3 7 9 5 9-5" />
        </svg>
        {t("klarnaSoon")}
      </span>
    </div>
  );
}
