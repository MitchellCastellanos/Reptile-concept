"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";

const SHOW_AFTER_PX = 480;

export function BackToTopButton() {
  const t = useTranslations("Nav");
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function updateVisibility() {
      setVisible(window.scrollY > SHOW_AFTER_PX);
    }
    updateVisibility();
    window.addEventListener("scroll", updateVisibility, { passive: true });
    return () => window.removeEventListener("scroll", updateVisibility);
  }, []);

  return (
    <button
      type="button"
      aria-label={t("backToTop")}
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      className={`fixed bottom-6 right-6 z-40 flex h-11 w-11 items-center justify-center rounded-full border border-border bg-card text-foreground shadow-md transition-all duration-200 hover:border-primary/50 hover:bg-accent-light hover:text-primary focus:outline-none focus:ring-2 focus:ring-primary/30 ${
        visible ? "translate-y-0 opacity-100" : "pointer-events-none translate-y-3 opacity-0"
      }`}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M12 19V5" strokeLinecap="round" />
        <path d="M6 11l6-6 6 6" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}
