"use client";

import { useEffect } from "react";
import { usePathname } from "@/i18n/navigation";
import { useLocale } from "next-intl";

// Collapses the duplicate effect run React Strict Mode performs in
// development. A real refresh reloads the module, so it is still counted.
const DUPLICATE_WINDOW_MS = 1000;
let lastKey = "";
let lastAt = 0;

function send(path: string, locale: string) {
  const body = JSON.stringify({ path, locale });
  if (navigator.sendBeacon) {
    navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
  } else {
    fetch("/api/track", {
      method: "POST",
      body,
      headers: { "Content-Type": "application/json" },
      keepalive: true,
    }).catch(() => {});
  }
}

export function PageViewTracker() {
  const pathname = usePathname();
  const locale = useLocale();

  useEffect(() => {
    const key = `${locale}:${pathname}`;
    const now = Date.now();
    if (key === lastKey && now - lastAt < DUPLICATE_WINDOW_MS) return;
    lastKey = key;
    lastAt = now;

    // A page the browser pre-renders in the background is not a real view yet.
    const doc = document as Document & { prerendering?: boolean };
    if (doc.prerendering) {
      const onActivate = () => send(pathname, locale);
      document.addEventListener("prerenderingchange", onActivate, { once: true });
      return () => document.removeEventListener("prerenderingchange", onActivate);
    }
    send(pathname, locale);
  }, [pathname, locale]);

  return null;
}
