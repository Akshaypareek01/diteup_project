/**
 * GST-inclusive invoice math: reverse-split tax from selling prices so
 * taxable + GST equals the amount the customer paid (never added on top).
 */
import { roundMoney } from "../utils/money.js";

export type InvoiceChargeLine = {
  inclusiveAmount: number;
  gstRate: number;
};

export type InvoiceGstBreakdown = {
  taxableTotal: number;
  cgst: number;
  sgst: number;
  igst: number;
  gstRates: number[];
};

/**
 * Splits a GST-inclusive amount into taxable value and tax.
 *
 * @param amount customer-facing inclusive amount
 * @param gstRate GST percent (e.g. 5)
 */
export function splitInclusive(amount: number, gstRate: number): { taxable: number; tax: number } {
  const amt = roundMoney(amount);
  const rate = roundMoney(gstRate);
  if (rate <= 0) return { taxable: amt, tax: 0 };
  const taxable = roundMoney((amt * 100) / (100 + rate));
  return { taxable, tax: roundMoney(amt - taxable) };
}

/**
 * GST slab for shipping / COD / leftover after discount.
 * Uses the product slab when all lines share one rate; otherwise amount-weighted.
 *
 * @param itemLines product lines with inclusive amounts
 */
export function extrasGstRate(itemLines: InvoiceChargeLine[]): number {
  if (itemLines.length === 0) return 0;
  const rates = [...new Set(itemLines.map((l) => roundMoney(l.gstRate)))];
  if (rates.length === 1) return rates[0]!;
  const weight = itemLines.reduce((s, l) => s + Math.abs(l.inclusiveAmount), 0);
  if (weight <= 0) return rates[0]!;
  return roundMoney(
    itemLines.reduce((s, l) => s + Math.abs(l.inclusiveAmount) * l.gstRate, 0) / weight,
  );
}

/**
 * Reverse-calculates invoice GST from product lines plus leftover vs grand total
 * (shipping, COD, discount). Footer always reconciles to `grandTotal`.
 */
export function buildInvoiceGst(args: {
  itemLines: InvoiceChargeLine[];
  grandTotal: number;
  intraState: boolean;
}): InvoiceGstBreakdown {
  const gstRates = args.itemLines.map((l) => roundMoney(l.gstRate));
  const extraRate = extrasGstRate(args.itemLines);
  const grand = roundMoney(args.grandTotal);

  let taxableTotal = 0;
  let taxTotal = 0;
  let itemInclusive = 0;

  for (const line of args.itemLines) {
    const amt = roundMoney(line.inclusiveAmount);
    itemInclusive = roundMoney(itemInclusive + amt);
    const split = splitInclusive(amt, line.gstRate);
    taxableTotal = roundMoney(taxableTotal + split.taxable);
    taxTotal = roundMoney(taxTotal + split.tax);
  }

  const leftover = roundMoney(grand - itemInclusive);
  if (leftover !== 0) {
    const split = splitInclusive(leftover, extraRate);
    taxableTotal = roundMoney(taxableTotal + split.taxable);
    taxTotal = roundMoney(taxTotal + split.tax);
  }

  const residual = roundMoney(grand - taxableTotal - taxTotal);
  if (residual !== 0) {
    taxTotal = roundMoney(taxTotal + residual);
  }

  if (args.intraState) {
    const cgst = roundMoney(taxTotal / 2);
    return { taxableTotal, cgst, sgst: roundMoney(taxTotal - cgst), igst: 0, gstRates };
  }
  return { taxableTotal, cgst: 0, sgst: 0, igst: taxTotal, gstRates };
}

/**
 * Formats GST % for invoice tax lines (single rate or mixed).
 *
 * @param rates per-line GST percents from `Product.gstRate`
 */
export function invoiceGstRateLabel(rates: number[]): string {
  const uniq = [...new Set(rates.map((r) => roundMoney(r)))];
  if (uniq.length === 0) return "";
  return uniq.map((r) => `${r}%`).join(" / ");
}

/**
 * CGST/SGST share of a single GST slab (half). Mixed slabs keep the raw label.
 *
 * @param rates per-line GST percents
 */
export function invoiceCgstSgstRateLabel(rates: number[]): string {
  const uniq = [...new Set(rates.map((r) => roundMoney(r)))];
  if (uniq.length !== 1) return invoiceGstRateLabel(rates);
  return `${roundMoney(uniq[0]! / 2)}%`;
}
