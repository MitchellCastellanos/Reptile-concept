"use client";

import { useSearchParams } from "next/navigation";
import { Link, usePathname } from "@/i18n/navigation";
import type { AnimalCategoryGroupKey, AnimalCategoryValue } from "@/lib/animal-categories";

export type GroupedCategorySection = {
  groupKey: AnimalCategoryGroupKey;
  groupLabel: string;
  items: { value: AnimalCategoryValue; label: string }[];
};

export function GroupedCategoryPillNav({
  sections,
  activeValue,
  allLabel,
}: {
  sections: GroupedCategorySection[];
  activeValue?: AnimalCategoryValue;
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
    <div className="flex flex-col gap-4">
      <div className="-mx-6 overflow-x-auto px-6 [scrollbar-width:thin]">
        <div className="flex w-max gap-2 pb-1">
          <Link href={hrefFor(undefined)} className={pillClass(!activeValue)}>
            {allLabel}
          </Link>
        </div>
      </div>

      {sections.map((section) => (
        <div key={section.groupKey} className="flex flex-col gap-2">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{section.groupLabel}</p>
          <div className="-mx-6 overflow-x-auto px-6 [scrollbar-width:thin]">
            <div className="flex w-max gap-2 pb-1">
              {section.items.map((item) => (
                <Link
                  key={item.value}
                  href={hrefFor(item.value)}
                  className={pillClass(activeValue === item.value)}
                >
                  {item.label}
                </Link>
              ))}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
