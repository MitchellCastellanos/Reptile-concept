"use client";

import { useTranslations } from "next-intl";
import { KlarnaMark } from "@/components/brand-marks";

export function KlarnaInstallments({
  priceCAD,
  className = "",
}: {
  priceCAD: number;
  className?: string;
}) {
  const t = useTranslations("Payments");
  const perPayment = (priceCAD / 4).toFixed(2);

  return (
    <span className={`inline-flex flex-wrap items-center gap-1.5 text-xs text-muted ${className}`}>
      {t("klarnaInstallments", { amount: perPayment })}
      <KlarnaMark />
    </span>
  );
}
