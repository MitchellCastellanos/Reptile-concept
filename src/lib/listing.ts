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
