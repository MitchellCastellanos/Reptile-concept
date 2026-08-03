import type { ReactNode } from "react";
import Link from "next/link";

export function AdminCatalogAlertSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="overflow-x-auto rounded-xl border border-amber-300/60 bg-amber-50/50 dark:border-amber-700/40 dark:bg-amber-950/20">
      <h2 className="border-b border-amber-200/80 px-4 py-2 text-sm font-semibold text-amber-900 dark:border-amber-800/60 dark:text-amber-100">
        {title}
      </h2>
      <div className="max-h-64 overflow-y-auto">{children}</div>
    </section>
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
