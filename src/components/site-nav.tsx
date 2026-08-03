"use client";

import Image from "next/image";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";
import { useCart } from "@/lib/cart-context";
import { LocaleSwitcher } from "@/components/locale-switcher";
import { CategoryMenu } from "@/components/category-menu";

export function SiteNav({
  isLoggedIn = false,
  wishlistCount = 0,
}: {
  isLoggedIn?: boolean;
  wishlistCount?: number;
}) {
  const t = useTranslations("Nav");
  const { items } = useCart();
  const itemCount = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-card/95 shadow-sm backdrop-blur">
      <nav className="mx-auto flex max-w-6xl items-center gap-2 px-4 py-3 sm:gap-4 sm:px-6">
        <div className="flex shrink-0 items-center">
          <CategoryMenu />
        </div>

        <Link href="/" className="flex min-w-0 flex-1 items-center justify-center gap-2">
          <Image src="/icon.png" alt="" width={32} height={32} className="h-8 w-8 shrink-0" priority />
          <span className="hidden whitespace-nowrap text-base font-semibold text-primary sm:inline sm:text-lg">
            Reptiles Concept
          </span>
        </Link>

        <div className="flex shrink-0 items-center gap-1.5 sm:gap-3">
          <LocaleSwitcher />
          {isLoggedIn ? (
            <Link
              href="/account/wishlist"
              className="flex items-center gap-1.5 rounded-full px-2 py-1.5 text-sm font-medium text-foreground hover:bg-accent-light hover:text-primary sm:px-3"
            >
              <span className="relative flex items-center">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M12 21s-7-4.35-9.33-8.5C.67 9.15 2.73 5.5 6.5 5.5c2.04 0 3.28 1.18 3.78 2.22C10.78 6.68 12.02 5.5 14.06 5.5 17.83 5.5 19.89 9.15 21.33 12.5 19 16.65 12 21 12 21z" />
                </svg>
                {wishlistCount > 0 ? (
                  <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] text-white">
                    {wishlistCount}
                  </span>
                ) : null}
              </span>
              <span className="hidden sm:inline">{t("wishlist")}</span>
            </Link>
          ) : null}
          <Link
            href="/account"
            className="flex items-center gap-1.5 rounded-full px-2 py-1.5 text-sm font-medium text-foreground hover:bg-accent-light hover:text-primary sm:px-3"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
              <circle cx="12" cy="8" r="4" />
              <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
            </svg>
            <span className="hidden sm:inline">{t("account")}</span>
          </Link>
          <Link
            href="/cart"
            className="flex items-center gap-1.5 rounded-full bg-accent-light px-2 py-1.5 text-sm font-medium text-accent hover:bg-accent/20 sm:px-3"
          >
            <span className="relative flex items-center">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M6 6h15l-1.5 9h-12z" />
                <circle cx="9" cy="20" r="1" />
                <circle cx="18" cy="20" r="1" />
                <path d="M6 6L5 3H2" />
              </svg>
              {itemCount > 0 ? (
                <span className="absolute -right-1.5 -top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[10px] text-white">
                  {itemCount}
                </span>
              ) : null}
            </span>
            <span className="hidden sm:inline">{t("cart")}</span>
          </Link>
        </div>
      </nav>
    </header>
  );
}
