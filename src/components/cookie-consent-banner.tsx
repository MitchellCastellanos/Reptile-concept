"use client";

import { useSyncExternalStore } from "react";
import { useTranslations } from "next-intl";
import { Link } from "@/i18n/navigation";

const STORAGE_KEY = "cookie_consent";
let listeners: Array<() => void> = [];

function subscribe(listener: () => void) {
  listeners.push(listener);
  return () => {
    listeners = listeners.filter((l) => l !== listener);
  };
}

function getSnapshot() {
  return localStorage.getItem(STORAGE_KEY) === "accepted";
}

function getServerSnapshot() {
  return true;
}

function accept() {
  localStorage.setItem(STORAGE_KEY, "accepted");
  listeners.forEach((listener) => listener());
}

export function CookieConsentBanner() {
  const t = useTranslations("Legal");
  const consented = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  if (consented) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 border-t border-border bg-primary px-6 py-4 text-white shadow-lg">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-3 sm:flex-row sm:justify-between">
        <p className="text-sm text-white/90">
          {t("cookieBannerText")}{" "}
          <Link href="/legal/cookies" className="underline hover:text-white">
            {t("cookieBannerLearnMore")}
          </Link>
        </p>
        <button
          type="button"
          onClick={accept}
          className="shrink-0 rounded-full bg-white px-5 py-2 text-sm font-semibold text-primary transition hover:bg-white/90"
        >
          {t("cookieBannerAccept")}
        </button>
      </div>
    </div>
  );
}
