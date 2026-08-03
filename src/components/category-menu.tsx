"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { Link, usePathname } from "@/i18n/navigation";
import { NAV_ITEMS, type NavTopItem } from "@/lib/nav-categories";

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={`h-4 w-4 shrink-0 text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
    >
      <path d="M6 9l6 6 6-6" />
    </svg>
  );
}

function AccordionTopItem({ item, onNavigate }: { item: NavTopItem; onNavigate: () => void }) {
  const [expanded, setExpanded] = useState(false);
  const t = useTranslations("Nav");
  const tCategories = useTranslations("NavCategories");

  return (
    <div className="flex flex-col">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        aria-expanded={expanded}
        className="flex items-center justify-between rounded-lg px-3 py-2.5 text-left text-sm font-semibold text-foreground hover:bg-accent-light"
      >
        {t(item.key)}
        <ChevronIcon open={expanded} />
      </button>

      <div
        className={`grid overflow-hidden transition-[grid-template-rows] duration-200 ease-out ${
          expanded ? "grid-rows-[1fr]" : "grid-rows-[0fr]"
        }`}
      >
        <div className="min-h-0 overflow-hidden">
          <div className="flex flex-col gap-0.5 py-1 pl-3">
            {item.sections?.map((section) => (
              <div key={section.key} className="flex flex-col pt-2 first:pt-0">
                <Link
                  href={section.href}
                  onClick={onNavigate}
                  className="rounded-lg px-3 py-1.5 text-base font-bold text-foreground hover:bg-accent-light hover:text-primary"
                >
                  {tCategories(section.key)}
                </Link>
                {section.items.map((leaf) => (
                  <Link
                    key={leaf.key}
                    href={leaf.href}
                    onClick={onNavigate}
                    className="rounded-lg px-3 py-2 text-sm text-foreground hover:bg-accent-light hover:text-primary"
                  >
                    {tCategories(leaf.key)}
                  </Link>
                ))}
              </div>
            ))}

            {item.items?.map((leaf) => (
              <Link
                key={leaf.key}
                href={leaf.href}
                onClick={onNavigate}
                className="rounded-lg px-3 py-2 text-sm text-foreground hover:bg-accent-light hover:text-primary"
              >
                {tCategories(leaf.key)}
              </Link>
            ))}

            {item.viewAllKey ? (
              <Link
                href={item.href}
                onClick={onNavigate}
                className="mt-1 rounded-lg px-3 py-2 text-sm font-medium text-accent hover:bg-accent-light"
              >
                {tCategories(item.viewAllKey)} →
              </Link>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}

export function CategoryMenu() {
  const pathname = usePathname();
  // Remounting on pathname change resets `open` to its initial value,
  // closing the menu after navigation without an effect-driven setState.
  return <CategoryMenuPanel key={pathname} />;
}

function CategoryMenuPanel() {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const t = useTranslations("Nav");

  useEffect(() => {
    if (!open) return;

    function handlePointerDown(event: PointerEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }

    document.addEventListener("pointerdown", handlePointerDown);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("pointerdown", handlePointerDown);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open]);

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-label={t("menu")}
        className="flex h-9 w-9 items-center justify-center rounded-lg text-foreground hover:bg-accent-light"
      >
        <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2">
          {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
        </svg>
      </button>

      {open ? (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20 md:bg-transparent"
            aria-hidden
            onClick={() => setOpen(false)}
          />
          <div
            role="menu"
            className="absolute left-0 top-full z-50 mt-2 flex max-h-[75vh] w-[85vw] max-w-xs flex-col overflow-y-auto rounded-2xl border border-border bg-card p-2 shadow-lg"
          >
            {NAV_ITEMS.map((item) =>
              item.sections || item.items ? (
                <AccordionTopItem key={item.key} item={item} onNavigate={() => setOpen(false)} />
              ) : (
                <Link
                  key={item.key}
                  href={item.href}
                  onClick={() => setOpen(false)}
                  className="rounded-lg px-3 py-2.5 text-sm font-semibold text-foreground hover:bg-accent-light"
                >
                  {t(item.key)}
                </Link>
              ),
            )}
          </div>
        </>
      ) : null}
    </div>
  );
}
