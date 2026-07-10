"use client";

import { useLocale } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";

export function LocaleSwitcher() {
  const locale = useLocale();
  const pathname = usePathname();

  return (
    <div className="flex items-center gap-1 rounded-full border border-border bg-card px-2 py-1 text-xs font-medium">
      <Link
        href={pathname}
        locale="fr"
        className={`rounded-full px-2 py-0.5 transition ${
          locale === "fr" ? "bg-primary text-white" : "text-muted hover:text-foreground"
        }`}
      >
        FR
      </Link>
      <Link
        href={pathname}
        locale="en"
        className={`rounded-full px-2 py-0.5 transition ${
          locale === "en" ? "bg-primary text-white" : "text-muted hover:text-foreground"
        }`}
      >
        EN
      </Link>
    </div>
  );
}
