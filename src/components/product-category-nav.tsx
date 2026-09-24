"use client";

import { useSearchParams } from "next/navigation";
import { Link, usePathname } from "@/i18n/navigation";
import { CategoryButtonGrid } from "@/components/category-button-grid";

export type ProductCategoryNavItem = { value: string; label: string; image: string };

const chipClass = (active: boolean) =>
  `rounded-full border px-4 py-2 text-sm font-medium transition ${
    active
      ? "border-primary bg-primary text-white shadow-sm"
      : "border-border bg-card text-foreground hover:border-primary/50 hover:bg-accent-light"
  }`;

/**
 * /boutique counterpart of GroupedCategoryButtonGrid: the same icon cards as the
 * home page, plus a second row of subcategory cards when the "food" group is open.
 */
export function ProductCategoryNav({
  items,
  activeTopValue,
  activeValue,
  allLabel,
  subItems,
  subAllLabel,
  subGroupLabel,
}: {
  items: ProductCategoryNavItem[];
  /** Highlighted card — the group ("food") when a food subcategory is active. */
  activeTopValue?: string;
  /** Exact `category` param, used to highlight the subcategory card. */
  activeValue?: string;
  allLabel: string;
  /** Subcategories of the active group; omitted when the active card has none. */
  subItems?: ProductCategoryNavItem[];
  subAllLabel?: string;
  subGroupLabel?: string;
}) {
  const pathname = usePathname();
  const searchParams = useSearchParams();

  function hrefFor(value?: string) {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("page");
    if (value) {
      params.set("category", value);
    } else {
      params.delete("category");
    }
    const query = params.toString();
    return query ? `${pathname}?${query}` : pathname;
  }

  return (
    <div className="flex flex-col gap-4">
      <Link href={hrefFor(undefined)} className={`self-start ${chipClass(!activeTopValue)}`}>
        {allLabel}
      </Link>

      <CategoryButtonGrid
        items={items.map(({ value, label, image }) => ({
          key: value,
          href: hrefFor(value),
          image,
          label,
          active: activeTopValue === value,
        }))}
      />

      {subItems && activeTopValue ? (
        <div className="mt-4 flex flex-col gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted">{subGroupLabel}</p>
            <Link href={hrefFor(activeTopValue)} className={chipClass(activeValue === activeTopValue)}>
              {subAllLabel}
            </Link>
          </div>
          <CategoryButtonGrid
            items={subItems.map(({ value, label, image }) => ({
              key: value,
              href: hrefFor(value),
              image,
              label,
              active: activeValue === value,
            }))}
          />
        </div>
      ) : null}
    </div>
  );
}
