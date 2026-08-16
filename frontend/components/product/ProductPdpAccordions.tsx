import type { ReactNode } from "react";
import type { PublicProduct } from "@/lib/types/catalog";
import { ProductPdpDescriptionContent } from "@/components/product/ProductPdpDescriptionContent";
import { ProductPdpFaqContent } from "@/components/product/ProductPdpFaqContent";
import { ProductPdpHowToUseContent } from "@/components/product/ProductPdpHowToUseContent";
import { ProductPdpIngredientsContent } from "@/components/product/ProductPdpIngredientsContent";
import { ProductPdpNutritionContent } from "@/components/product/ProductPdpNutritionContent";
import { ProductPdpWhoIsThisForContent } from "@/components/product/ProductPdpWhoIsThisForContent";
import { cn } from "@/lib/utils";

export type ProductPdpAccordionsProps = {
  product: PublicProduct;
  className?: string;
};

type RowProps = { title: string; children: ReactNode };

/** One native `<details>` row with design-system chevron. */
function AccordionRow({ title, children }: RowProps) {
  return (
    <details className="group border-b border-line first:border-t">
      <summary
        className={cn(
          "flex cursor-pointer list-none items-center justify-between gap-3 py-4 pr-1 font-semibold uppercase tracking-wide text-ink",
          "[&::-webkit-details-marker]:hidden",
        )}
      >
        <span>{title}</span>
        <svg
          className="size-5 shrink-0 text-ink-muted transition group-open:rotate-180"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M6 9l6 6 6-6" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </summary>
      <div className="pb-4 text-body-sm leading-relaxed text-ink-soft">{children}</div>
    </details>
  );
}

/**
 * Expandable product information blocks (description through FAQ).
 */
export function ProductPdpAccordions({ className }: ProductPdpAccordionsProps) {
  return (
    <section aria-label="Product details" className={cn(className)}>
      <AccordionRow title="Description">
        <ProductPdpDescriptionContent />
      </AccordionRow>
      <AccordionRow title="Ingredients">
        <ProductPdpIngredientsContent />
      </AccordionRow>
      <AccordionRow title="Nutrition facts">
        <ProductPdpNutritionContent />
      </AccordionRow>
      <AccordionRow title="How to use">
        <ProductPdpHowToUseContent />
      </AccordionRow>
      <AccordionRow title="Who is this for?">
        <ProductPdpWhoIsThisForContent />
      </AccordionRow>
      <AccordionRow title="FAQ">
        <ProductPdpFaqContent />
      </AccordionRow>
    </section>
  );
}
