import Link from "next/link";
import type { PublicProduct } from "@/lib/types/catalog";
import { formatInr, moneyNumber } from "@/lib/format-money";

export type StickyBuyBarProps = { featured: PublicProduct | null };

/**
 * Mobile sticky buy bar — PRD §6.2 (kept under ~12% viewport).
 */
export function StickyBuyBar({ featured }: StickyBuyBarProps) {
  const href = featured ? `/product/${featured.slug}` : "/";
  const from =
    featured && featured.variants.length > 0
      ? Math.min(...featured.variants.map((v) => moneyNumber(v.priceSale)))
      : null;
  const label =
    featured && from != null ? `Buy now — from ${formatInr(from)}` : "Shop DiteUp";
  return (
    <div
      className="fixed inset-x-0 bottom-0 z-40 border-t border-line-dark/50 bg-cream/95 p-3 backdrop-blur-md md:hidden"
      style={{ paddingBottom: "max(0.75rem, env(safe-area-inset-bottom))" }}
      role="region"
      aria-label="Buy now"
    >
      <Link
        href={href}
        className="flex h-12 w-full items-center justify-center rounded-lg bg-gold font-sans text-button font-semibold uppercase tracking-wide text-forest shadow-sm"
      >
        {label}
      </Link>
    </div>
  );
}
