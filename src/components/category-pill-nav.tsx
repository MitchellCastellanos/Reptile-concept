"use client";

import { useSearchParams } from "next/navigation";
import { Link, usePathname } from "@/i18n/navigation";

export type CategoryPillItem = {
  value: string;
  label: string;
};

export function CategoryPillNav({
  items,
  activeValue,
  allLabel,
}: {
  items: CategoryPillItem[];
  activeValue?: string;
  allLabel: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function hrefFor(value?: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set("category", value);
    } else {
      params.delete("category");
    }
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  }

  const pillClass = (active: boolean) =>
    `shrink-0 whitespace-nowrap rounded-full border px-4 py-2 text-sm font-medium transition ${
      active
        ? "border-primary bg-primary text-white shadow-sm"
        : "border-border bg-card text-foreground hover:border-primary/50 hover:bg-accent-light"
    }`;

  return (
    <div className="-mx-6 overflow-x-auto px-6 [scrollbar-width:thin]">
      <div className="flex w-max gap-2 pb-1">
        <Link href={hrefFor(undefined)} className={pillClass(!activeValue)}>
          {allLabel}
        </Link>
        {items.map((item) => (
          <Link key={item.value} href={hrefFor(item.value)} className={pillClass(activeValue === item.value)}>
            {item.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
