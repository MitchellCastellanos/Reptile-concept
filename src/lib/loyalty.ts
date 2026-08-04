/** 1 loyalty point per $1 CAD spent (subtotal, pre-tax), rounded down. */
export function pointsForSubtotal(subtotalCAD: number): number {
  return Math.max(0, Math.floor(subtotalCAD));
}
