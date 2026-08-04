// Canadian federal (TPS/GST) + Quebec provincial (TVQ/QST) tax calculation.
// Since the 2013 harmonization, QST is calculated on the pre-tax price only
// (no "tax on tax"), so both amounts are derived independently from the same
// subtotal. Pure numeric logic — safe to import from client components too.

export type TaxRates = {
  gstRatePercent: number;
  qstRatePercent: number;
};

export type TaxBreakdown = {
  subtotalCAD: number;
  gstAmountCAD: number;
  qstAmountCAD: number;
  totalCAD: number;
};

function round2(amount: number) {
  return Math.round(amount * 100) / 100;
}

export function computeTax(subtotalCAD: number, rates: TaxRates): TaxBreakdown {
  const subtotal = round2(subtotalCAD);
  const gstAmountCAD = round2(subtotal * (rates.gstRatePercent / 100));
  const qstAmountCAD = round2(subtotal * (rates.qstRatePercent / 100));
  return {
    subtotalCAD: subtotal,
    gstAmountCAD,
    qstAmountCAD,
    totalCAD: round2(subtotal + gstAmountCAD + qstAmountCAD),
  };
}

// Clover's Orders API only gives us the final tax-inclusive total the
// customer paid at the register, not a subtotal/tax breakdown — the
// standalone device doesn't send one back through the sync. Back out the
// same GST/QST split computeTax() would have produced by inverting its
// formula: total = subtotal * (1 + gstRate/100 + qstRate/100).
export function estimateTaxFromTaxInclusiveTotal(totalCAD: number, rates: TaxRates): TaxBreakdown {
  const combinedRate = (rates.gstRatePercent + rates.qstRatePercent) / 100;
  const subtotal = totalCAD / (1 + combinedRate);
  return computeTax(subtotal, rates);
}
