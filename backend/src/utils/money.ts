/**
 * INR money helpers — keep 2-decimal consistency for cart/order math.
 */

/** Round to 2 decimal places (banker's rounding not required for display totals). */
export function roundMoney(n: number): number {
  return Math.round((n + Number.EPSILON) * 100) / 100;
}

/** Coerce Prisma `Decimal` or number to plain number. */
export function moneyNumber(d: { toNumber(): number } | number): number {
  return typeof d === "number" ? d : d.toNumber();
}
