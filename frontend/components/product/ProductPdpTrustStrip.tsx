import type { ReactNode } from "react";
import type { PublicProduct } from "@/lib/types/catalog";
import { formatInr } from "@/lib/format-money";
import { FREE_SHIPPING_THRESHOLD_INR, RETURN_WINDOW_DAYS } from "@/lib/storefront-policy-constants";
import { cn } from "@/lib/utils";

export type ProductPdpTrustStripProps = {
  product: PublicProduct;
  className?: string;
};

type TrustItem = { label: string; icon: ReactNode };

/** Circle + rupee glyph for COD trust row (PDP mock). */
function CodRupeeGlyph() {
  return (
    <svg className="size-7 text-ink-soft" viewBox="0 0 24 24" fill="none" aria-hidden stroke="currentColor" strokeWidth="1.65">
      <circle cx="12" cy="12" r="9.25" />
      <text
        x="12"
        y="13.55"
        fill="currentColor"
        dominantBaseline="middle"
        fontFamily="Montserrat, system-ui, sans-serif"
        fontSize="11"
        fontWeight="700"
        stroke="none"
        textAnchor="middle"
      >
        ₹
      </text>
    </svg>
  );
}

/** Card-style glyph when COD is disabled (distinct from rupee COD art). */
function SecurePayGlyph() {
  return (
    <svg className="size-7 text-ink-soft" viewBox="0 0 24 24" fill="none" aria-hidden stroke="currentColor" strokeWidth="1.65">
      <rect x="3.5" y="6" width="17" height="12" rx="2.25" />
      <path d="M3.75 11h17" strokeLinecap="round" />
      <rect x="6.25" y="14.5" width="4.15" height="2.85" rx="0.42" strokeLinecap="round" />
      <circle cx="16.62" cy="15.93" r="1.62" strokeLinecap="round" />
      <circle cx="19.82" cy="15.93" r="1.62" strokeLinecap="round" />
    </svg>
  );
}

/**
 * Shipping / payment / returns badges under PDP primary CTAs (mock: graphite pictograms + captions).
 */
export function ProductPdpTrustStrip({ product, className }: ProductPdpTrustStripProps) {
  const items: TrustItem[] = [
    {
      label: `Free Shipping above ${formatInr(FREE_SHIPPING_THRESHOLD_INR)}`,
      icon: (
        <svg className="size-7 text-ink-soft" viewBox="0 0 24 24" fill="none" aria-hidden stroke="currentColor" strokeWidth="1.65">
          <path d="M3 7h11v10H3V7zm11 0h4l3 3v4h-7V7z" strokeLinejoin="round" />
          <circle cx="7.5" cy="18" r="1.5" />
          <circle cx="17.5" cy="18" r="1.5" />
        </svg>
      ),
    },
    {
      label: product.codEnabled ? "COD Available" : "Secure online pay",
      icon: product.codEnabled ? <CodRupeeGlyph /> : <SecurePayGlyph />,
    },
    {
      label: `${RETURN_WINDOW_DAYS} Days Return`,
      icon: (
        <span className="relative inline-flex size-7 shrink-0 items-center justify-center text-ink-soft" aria-hidden>
          <svg className="absolute inset-0 size-7" viewBox="0 0 24 24" fill="none">
            <path
              d="M8 7H4v4M4 13a8 8 0 0014.32 3.9M16 17h4v-4M20 11a8 8 0 00-14.32-3.9"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.65"
            />
          </svg>
          <span className="relative z-[1] font-sans text-[0.625rem] font-bold tracking-tight text-current">7</span>
        </span>
      ),
    },
  ];

  return (
    <section aria-label="Policies" className={cn(className)}>
      <ul className="grid grid-cols-3 gap-2 px-1 sm:gap-3">
        {items.map((item) => (
          <li key={item.label} className="flex flex-col items-center gap-2 text-center">
            <span className="flex h-12 items-center justify-center">{item.icon}</span>
            <span className="font-sans text-[0.6875rem] font-medium leading-snug text-ink-muted sm:text-body-sm">{item.label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
