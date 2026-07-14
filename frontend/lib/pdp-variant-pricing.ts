import { formatInr, moneyNumber } from "@/lib/format-money";
import type { PublicProductVariant } from "@/lib/types/catalog";

/**
 * Parses grams from variant labels like "750 g — pack" or "1.5Kg — pack".
 */
export function parseVariantWeightGrams(variantName: string): number | null {
  const normalized = variantName.trim().toLowerCase();

  const kgMatch = normalized.match(/(\d+(?:\.\d+)?)\s*kg/);
  if (kgMatch) {
    return Math.round(Number(kgMatch[1]) * 1000);
  }

  const gMatch = normalized.match(/(\d+(?:\.\d+)?)\s*g\b/);
  if (gMatch) {
    return Math.round(Number(gMatch[1]));
  }

  return null;
}

export type VariantPricePerKg = {
  variantId: string;
  grams: number;
  pricePerKg: number;
  formattedPerKg: string;
};

/**
 * Computes ₹/kg for each variant that has a parseable weight.
 */
export function computeVariantPricesPerKg(variants: PublicProductVariant[]): VariantPricePerKg[] {
  return variants
    .map((variant) => {
      const grams = parseVariantWeightGrams(variant.name);
      if (!grams || grams <= 0) return null;

      const sale = moneyNumber(variant.priceSale);
      if (sale <= 0) return null;

      const pricePerKg = (sale / grams) * 1000;
      return {
        variantId: variant.id,
        grams,
        pricePerKg,
        formattedPerKg: formatInr(Math.round(pricePerKg)),
      };
    })
    .filter((row): row is VariantPricePerKg => row !== null);
}

/**
 * Returns the variant id with the lowest ₹/kg, or null when none are computable.
 */
export function findBestValueVariantId(variants: PublicProductVariant[]): string | null {
  const rows = computeVariantPricesPerKg(variants);
  if (rows.length === 0) return null;

  return rows.reduce((best, row) => (row.pricePerKg < best.pricePerKg ? row : best)).variantId;
}
