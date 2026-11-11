// Pure promo math — kept free of server-only imports so the checkout form
// (a client component) can preview the same discount the server will charge.
export function computeDiscount(subtotalCAD: number, percentOff: number) {
  return Math.round(subtotalCAD * percentOff) / 100;
}
