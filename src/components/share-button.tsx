"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

export function ShareButton({ title, url }: { title: string; url: string }) {
  const t = useTranslations("Share");
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  async function handleClick() {
    if (typeof navigator !== "undefined" && "share" in navigator) {
      try {
        await navigator.share({ title, url });
        return;
      } catch {
        // User cancelled the native share sheet, or it's not actually
        // supported despite the feature check — fall back to the menu.
      }
    }
    setOpen((prev) => !prev);
  }

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard API unavailable (e.g. insecure context) — nothing to do.
    }
  }

  const encodedUrl = encodeURIComponent(url);
  const encodedTitle = encodeURIComponent(title);
  const links = [
    { key: "facebook", label: t("facebook"), href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}` },
    { key: "whatsapp", label: t("whatsapp"), href: `https://wa.me/?text=${encodedTitle}%20${encodedUrl}` },
    { key: "x", label: t("x"), href: `https://twitter.com/intent/tweet?url=${encodedUrl}&text=${encodedTitle}` },
  ];

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleClick}
        aria-label={t("share")}
        title={t("share")}
        className="flex h-9 w-9 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-sm transition hover:border-primary/50 hover:text-primary"
      >
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="18" cy="5" r="3" fill="currentColor" stroke="none" />
          <circle cx="6" cy="12" r="3" fill="currentColor" stroke="none" />
          <circle cx="18" cy="19" r="3" fill="currentColor" stroke="none" />
          <path d="M8.6 10.5l6.8-3.9M8.6 13.5l6.8 3.9" strokeLinecap="round" />
        </svg>
      </button>

      {open ? (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full z-50 mt-2 flex w-48 flex-col overflow-hidden rounded-xl border border-border bg-card shadow-lg">
            {links.map((link) => (
              <a
                key={link.key}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                onClick={() => setOpen(false)}
                className="px-4 py-2.5 text-sm text-foreground hover:bg-accent-light"
              >
                {link.label}
              </a>
            ))}
            <button
              type="button"
              onClick={copyLink}
              className="border-t border-border px-4 py-2.5 text-left text-sm text-foreground hover:bg-accent-light"
            >
              {copied ? t("copied") : t("copyLink")}
            </button>
          </div>
        </>
      ) : null}
    </div>
  );
}
