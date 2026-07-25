"use client";

import { useEffect } from "react";
import { usePathname } from "@/i18n/navigation";
import { useLocale } from "next-intl";

export function PageViewTracker() {
  const pathname = usePathname();
  const locale = useLocale();

  useEffect(() => {
    const body = JSON.stringify({ path: pathname, locale });
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
    } else {
      fetch("/api/track", { method: "POST", body, keepalive: true }).catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname, locale]);

  return null;
}
