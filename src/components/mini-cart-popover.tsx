"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCart } from "@/lib/cart-context";

const btnPrimary =
  "flex-1 rounded-full bg-primary px-4 py-2 text-center text-xs font-medium text-white transition hover:bg-primary-light";
const btnSecondary =
  "flex-1 rounded-full border border-border px-4 py-2 text-center text-xs font-medium text-foreground transition hover:bg-accent-light";

export function MiniCartPopover() {
  const { notice, dismissNotice, items, totalCAD } = useCart();
  const t = useTranslations("Cart");

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(dismissNotice, 6000);
    return () => clearTimeout(timer);
  }, [notice, dismissNotice]);

  if (!notice) return null;

  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <div
      role="status"
      className="animate-fade-in-up fixed bottom-4 right-4 z-50 w-[calc(100vw-2rem)] max-w-sm rounded-2xl border border-border bg-card p-4 shadow-lg sm:bottom-6 sm:right-6"
    >
      <div className="flex items-start gap-2">
        <svg
          viewBox="0 0 24 24"
          className="mt-0.5 h-4 w-4 shrink-0 text-primary"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        <p className="flex-1 text-sm text-foreground">
          {t("addedToCart", { name: notice.name })}
        </p>
        <button
          type="button"
          onClick={dismissNotice}
          aria-label={t("close")}
          className="text-muted hover:text-foreground"
        >
          ✕
        </button>
      </div>
      <p className="mt-1 pl-6 text-xs text-muted">
        {t("itemsInCart", { count: itemCount })} · {totalCAD} $ CAD
      </p>
      <div className="mt-3 flex gap-2 pl-6">
        <button type="button" onClick={dismissNotice} className={btnSecondary}>
          {t("continueShoppingCta")}
        </button>
        <Link href="/checkout" onClick={dismissNotice} className={btnPrimary}>
          {t("checkout")}
        </Link>
      </div>
    </div>
  );
}
