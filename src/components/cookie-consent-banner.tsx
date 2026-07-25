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
    <div className="fixed inset-x-4 bottom-4 z-50 mx-auto flex max-w-sm flex-col gap-3 rounded-2xl border border-border bg-primary p-4 pr-9 text-white shadow-lg sm:inset-x-auto sm:left-4 sm:mx-0">
      <button
        type="button"
        onClick={accept}
        aria-label={t("cookieBannerClose")}
        className="absolute right-3 top-3 text-lg leading-none text-white/60 hover:text-white"
      >
        &times;
      </button>
      <p className="text-sm text-white/90">
        {t("cookieBannerText")}{" "}
        <Link href="/legal/cookies" className="underline hover:text-white">
          {t("cookieBannerLearnMore")}
        </Link>
      </p>
      <button
        type="button"
        onClick={accept}
        className="self-start rounded-full bg-white px-5 py-2 text-sm font-semibold text-primary transition hover:bg-white/90"
      >
        {t("cookieBannerAccept")}
      </button>
    </div>
  );
}
