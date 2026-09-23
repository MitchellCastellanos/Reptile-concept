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
 * home page, plus a wrapped row of subcategory chips when the "food" group is open.
 */
export function ProductCategoryNav({
  items,
  activeTopValue,
  activeValue,
  allLabel,
  subItems,
  subAllLabel,
}: {
  items: ProductCategoryNavItem[];
  /** Highlighted card — the group ("food") when a food subcategory is active. */
  activeTopValue?: string;
  /** Exact `category` param, used to highlight the subcategory chip. */
  activeValue?: string;
  allLabel: string;
  /** Subcategories of the active group; omitted when the active card has none. */
  subItems?: { value: string; label: string }[];
  subAllLabel?: string;
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
        <div className="flex flex-wrap gap-2">
          <Link href={hrefFor(activeTopValue)} className={chipClass(activeValue === activeTopValue)}>
            {subAllLabel}
          </Link>
          {subItems.map((item) => (
            <Link key={item.value} href={hrefFor(item.value)} className={chipClass(activeValue === item.value)}>
              {item.label}
            </Link>
          ))}
        </div>
      ) : null}
    </div>
  );
}
