import { cn } from "@/lib/utils";

export type ProductPdpUspHighlightProps = {
  className?: string;
};

/**
 * Lime-green USP callout strip under the product title (CRO issue 1).
 */
export function ProductPdpUspHighlight({ className }: ProductPdpUspHighlightProps) {
  return (
    <p
      className={cn(
        "rounded-lg bg-[#E8F5C8] px-3 py-2 font-sans text-[0.8125rem] font-medium leading-snug text-ink sm:text-body-sm",
        className,
      )}
      role="note"
      aria-label="Product highlights"
    >
      High protein &amp; fiber per serving — no added sugar or preservatives!
    </p>
  );
}
