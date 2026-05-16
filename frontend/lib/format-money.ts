/**
 * Normalizes API decimals (number | string) for display.
 */
export function moneyNumber(v: unknown): number {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string") {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return 0;
}

/**
 * Formats INR for storefront UI (no fractional paise unless needed).
 */
export function formatInr(amount: unknown): string {
  const n = moneyNumber(amount);
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: n % 1 === 0 ? 0 : 2,
  }).format(n);
}
