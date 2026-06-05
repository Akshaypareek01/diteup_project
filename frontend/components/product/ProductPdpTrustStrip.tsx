import { cn } from "@/lib/utils";

export type ProductPdpTrustStripProps = {
  className?: string;
};

/**
 * Shipping note under PDP primary CTAs.
 */
export function ProductPdpTrustStrip({ className }: ProductPdpTrustStripProps) {
  return (
    <section aria-label="Shipping policy" className={cn(className)}>
      <p className="flex items-center justify-center gap-2 text-center font-sans text-body-sm font-medium text-ink-muted">
        <svg className="size-5 shrink-0 text-ink-soft" viewBox="0 0 24 24" fill="none" aria-hidden stroke="currentColor" strokeWidth="1.65">
          <path d="M3 7h11v10H3V7zm11 0h4l3 3v4h-7V7z" strokeLinejoin="round" />
          <circle cx="7.5" cy="18" r="1.5" />
          <circle cx="17.5" cy="18" r="1.5" />
        </svg>
        Free shipping available
      </p>
    </section>
  );
}
