import { useTranslations } from "next-intl";

// Makes it unmistakable that the shop does not deliver (yet) and states the
// pickup windows. Works in server and client components.
// - "all": cart/checkout (cart may mix products) — lists both windows.
// - "liveFood": product pages for live feeders (crickets…) — 48 h window only.
// - "standard": other products/animals — standard window only.
export function PickupNotice({
  variant = "all",
  className = "",
}: {
  variant?: "all" | "liveFood" | "standard";
  className?: string;
}) {
  const t = useTranslations("Pickup");
  return (
    <div
      className={`rounded-xl border border-border bg-accent-light px-4 py-3 text-sm text-foreground ${className}`}
    >
      <p className="font-medium">{t("title")}</p>
      <p className="text-muted">{t("noDelivery")}</p>
      {variant !== "liveFood" ? <p className="mt-1 text-muted">{t("standardWindow")}</p> : null}
      {variant !== "standard" ? <p className="mt-1 text-muted">{t("liveFoodWindow")}</p> : null}
    </div>
  );
}
