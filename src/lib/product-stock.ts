// Helpers for the boutique "Back in stock" badge.
export const BACK_IN_STOCK_WINDOW_DAYS = 14;

export function isBackInStock(product: {
  stockQty: number;
  stockRestockedAt?: Date | null;
}): boolean {
  if (product.stockQty <= 0 || !product.stockRestockedAt) return false;
  const cutoff = Date.now() - BACK_IN_STOCK_WINDOW_DAYS * 24 * 60 * 60 * 1000;
  return product.stockRestockedAt.getTime() >= cutoff;
}
