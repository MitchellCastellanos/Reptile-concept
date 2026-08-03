// Shared sort/stock-filter vocabulary for the /animals and /boutique
// listing pages — kept framework-agnostic so both the toolbar client
// component and the server queries can import it.
export const LISTING_SORTS = ["newest", "price_asc", "price_desc"] as const;
export type ListingSort = (typeof LISTING_SORTS)[number];

export function isListingSort(value: string | undefined): value is ListingSort {
  return !!value && (LISTING_SORTS as readonly string[]).includes(value);
}

export const STOCK_FILTERS = ["all", "in_stock", "out_of_stock"] as const;
export type StockFilter = (typeof STOCK_FILTERS)[number];

export function isStockFilter(value: string | undefined): value is StockFilter {
  return !!value && (STOCK_FILTERS as readonly string[]).includes(value);
}

export const LISTING_PAGE_SIZES = [25, 50, 100] as const;
export type ListingPageSize = (typeof LISTING_PAGE_SIZES)[number];
export const DEFAULT_LISTING_PAGE_SIZE: ListingPageSize = 25;

export function parsePageSize(value: string | undefined): ListingPageSize {
  const num = Number(value);
  return (LISTING_PAGE_SIZES as readonly number[]).includes(num)
    ? (num as ListingPageSize)
    : DEFAULT_LISTING_PAGE_SIZE;
}

export function parsePageNumber(value: string | undefined): number {
  const num = Number(value);
  return Number.isInteger(num) && num > 0 ? num : 1;
}
