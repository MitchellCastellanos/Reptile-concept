"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCart } from "@/lib/cart-context";
import { LocaleSwitcher } from "@/components/locale-switcher";

export function SiteNav() {
  const t = useTranslations("Nav");
  const { items } = useCart();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 shadow-sm backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-3">
        <Link href="/" className="flex items-center gap-2">
          <Image src="/icon.png" alt="" width={32} height={32} className="h-8 w-8" priority />
          <span className="text-lg font-semibold text-primary">Reptile Concept</span>
        </Link>

        <div className="hidden items-center gap-6 text-sm font-medium md:flex">
          <Link href="/" className="text-foreground hover:text-primary">
            {t("home")}
          </Link>
          <Link href="/animals" className="text-foreground hover:text-primary">
            {t("animals")}
          </Link>
          <Link href="/boutique" className="text-foreground hover:text-primary">
            {t("boutique")}
          </Link>
          <Link href="/reviews" className="text-foreground hover:text-primary">
            {t("reviews")}
          </Link>
        </div>

        <div className="flex items-center gap-3">
          <LocaleSwitcher />
          <Link
            href="/cart"
            className="relative flex items-center gap-1.5 rounded-full bg-accent-light px-3 py-1.5 text-sm font-medium text-accent hover:bg-accent/20"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M6 6h15l-1.5 9h-12z" />
              <circle cx="9" cy="20" r="1" />
              <circle cx="18" cy="20" r="1" />
              <path d="M6 6L5 3H2" />
            </svg>
            {t("cart")}
            {itemCount > 0 ? (
              <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1 text-xs text-white">
                {itemCount}
              </span>
            ) : null}
          </Link>
        </div>
      </nav>
    </header>
  );
}
