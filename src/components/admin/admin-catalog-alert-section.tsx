"use client";

import { useEffect, useRef, type ReactNode } from "react";
import Link from "next/link";

export function AdminCatalogAlertSection({
  title,
  storageKey,
  children,
}: {
  title: string;
  // Remembers open/closed per list across page loads (localStorage).
  storageKey: string;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDetailsElement>(null);
  const key = `admin-alert-open:${storageKey}`;

  useEffect(() => {
    try {
      if (ref.current && localStorage.getItem(key) === "1") ref.current.open = true;
    } catch {
      // Storage unavailable — stay collapsed.
    }
  }, [key]);

  function handleToggle() {
    try {
      localStorage.setItem(key, ref.current?.open ? "1" : "0");
    } catch {
      // Storage unavailable — ignore.
    }
  }

  return (
    // Collapsed by default so the alert list doesn't push the main table down.
    <details ref={ref} onToggle={handleToggle} className="group overflow-x-auto rounded-xl border border-amber-300/60 bg-amber-50/50 dark:border-amber-700/40 dark:bg-amber-950/20">
      <summary className="flex cursor-pointer list-none items-center justify-between gap-3 px-4 py-2 text-sm font-semibold text-amber-900 group-open:border-b group-open:border-amber-200/80 dark:text-amber-100 dark:group-open:border-amber-800/60 [&::-webkit-details-marker]:hidden">
        <h2>{title}</h2>
        <span className="shrink-0 text-xs font-medium text-amber-800/80 dark:text-amber-200/70">
          <span className="group-open:hidden">Afficher ▾</span>
          <span className="hidden group-open:inline">Masquer ▴</span>
        </span>
      </summary>
      <div className="max-h-64 overflow-y-auto">{children}</div>
    </details>
  );
}

export function AdminAlertRowLink({
  href,
  primary,
  secondary,
  badge,
}: {
  href: string;
  primary: string;
  secondary?: string;
  badge: string;
}) {
  return (
    <Link
      href={href}
      className="flex items-center justify-between gap-3 border-b border-amber-200/50 px-4 py-2 text-sm last:border-0 hover:bg-amber-100/60 dark:border-amber-900/40 dark:hover:bg-amber-900/30"
    >
      <span>
        <span className="font-medium">{primary}</span>
        {secondary ? (
          <span className="mt-0.5 block text-xs text-amber-800/80 dark:text-amber-200/70">{secondary}</span>
        ) : null}
      </span>
      <span className="shrink-0 rounded-full bg-amber-500 px-2 py-0.5 text-xs font-medium text-white">
        {badge}
      </span>
    </Link>
  );
}
