"use client";

import { useSearchParams } from "next/navigation";
import { Link, usePathname } from "@/i18n/navigation";
import { CategoryButtonGrid } from "@/components/category-button-grid";
import type { AnimalCategoryGroupKey, AnimalCategoryValue } from "@/lib/animal-categories";

export type GroupedCategoryButtonSection = {
  groupKey: AnimalCategoryGroupKey;
  groupLabel: string;
  items: { value: AnimalCategoryValue; label: string; image: string }[];
};

export function GroupedCategoryButtonGrid({
  sections,
  activeValue,
  allLabel,
}: {
  sections: GroupedCategoryButtonSection[];
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

  return (
    <div className="flex flex-col gap-8">
      <Link
        href={hrefFor(undefined)}
        className={`self-start rounded-full border px-4 py-2 text-sm font-medium transition ${
          !activeValue
            ? "border-primary bg-primary text-white shadow-sm"
            : "border-border bg-card text-foreground hover:border-primary/50 hover:bg-accent-light"
        }`}
      >
        {allLabel}
      </Link>

      {sections.map((section) => (
        <div key={section.groupKey} className="flex flex-col gap-3">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted">{section.groupLabel}</p>
          <CategoryButtonGrid
            items={section.items.map(({ value, label, image }) => ({
              key: value,
              href: hrefFor(value),
              image,
              label,
              active: activeValue === value,
            }))}
          />
        </div>
      ))}
    </div>
  );
}
