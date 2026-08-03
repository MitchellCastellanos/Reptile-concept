"use client";

import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { useRouter, usePathname } from "@/i18n/navigation";
import { LISTING_SORTS, STOCK_FILTERS, type ListingSort, type StockFilter } from "@/lib/listing";

export function ListingToolbar({
  resultCount,
  showStockFilter = false,
}: {
  resultCount: number;
  showStockFilter?: boolean;
}) {
  const t = useTranslations("Listing");
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const sort = (searchParams.get("sort") as ListingSort) || "newest";
  const stock = (searchParams.get("stock") as StockFilter) || "in_stock";

  function update(key: "sort" | "stock", value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value === "newest" || value === "in_stock") {
      params.delete(key);
    } else {
      params.set(key, value);
    }
    const query = params.toString();
    router.push(query ? `${pathname}?${query}` : pathname);
  }

  const selectClass =
    "rounded-full border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground hover:border-primary/50 focus:outline-none focus:ring-2 focus:ring-primary/30";

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-border pb-4">
      <p className="text-sm text-muted">{t("resultCount", { count: resultCount })}</p>
      <div className="flex flex-wrap items-center gap-2">
        {showStockFilter ? (
          <select
            aria-label={t("stockLabel")}
            value={stock}
            onChange={(e) => update("stock", e.target.value)}
            className={selectClass}
          >
            {STOCK_FILTERS.map((value) => (
              <option key={value} value={value}>
                {t(`stock_${value}`)}
              </option>
            ))}
          </select>
        ) : null}
        <select
          aria-label={t("sortLabel")}
          value={sort}
          onChange={(e) => update("sort", e.target.value)}
          className={selectClass}
        >
          {LISTING_SORTS.map((value) => (
            <option key={value} value={value}>
              {t(`sort_${value}`)}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
