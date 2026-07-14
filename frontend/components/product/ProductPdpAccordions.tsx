import Link from "next/link";
import type { ReactNode } from "react";
import type { PublicProduct } from "@/lib/types/catalog";
import { getHomePreviewFaqItems } from "@/lib/energy-bite-faqs";
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

const previewFaqs = getHomePreviewFaqItems();

/**
 * Expandable product information blocks (description through FAQ preview).
 */
export function ProductPdpAccordions({ product, className }: ProductPdpAccordionsProps) {
  const description =
    product.description?.trim() ||
    product.shortDesc?.trim() ||
    "Energy Bite is a clean, everyday snack mix crafted with nuts, seeds, and legumes — designed for steady energy without the junk.";

  const ingredients =
    product.shortDesc?.trim() ||
    "Almonds, cashews, roasted chickpeas, seeds, and natural seasonings. See pack label for the full ingredient statement.";

  return (
    <section aria-label="Product details" className={cn(className)}>
      <AccordionRow title="Description">{description}</AccordionRow>
      <AccordionRow title="Ingredients">{ingredients}</AccordionRow>
      <AccordionRow title="Nutrition facts">
        Values are approximate per serving. Refer to the physical pack for the authoritative nutrition panel, allergens, and
        batch details.
      </AccordionRow>
      <AccordionRow title="How to use">
        Enjoy a small handful between meals, post-workout, or whenever you want a satisfying crunch. Pair with fruit or yogurt
        for a fuller snack.
      </AccordionRow>
      <AccordionRow title="Who is this for?">
        Busy professionals, students, travelers, and anyone who wants a pantry-stable, high-protein snack without added sugar
        or preservatives.
      </AccordionRow>
      <AccordionRow title="FAQ">
        <dl className="space-y-4">
          {previewFaqs.map((item) => (
            <div key={item.question}>
              <dt className="font-semibold text-forest">{item.question}</dt>
              <dd className="mt-1">{item.answer}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-6 flex justify-center">
          <Link
            href="/faq"
            className="inline-flex h-10 min-w-[8rem] items-center justify-center rounded-md border border-forest bg-transparent px-6 font-sans text-xs font-semibold uppercase tracking-wide text-forest transition hover:bg-forest/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
          >
            More
          </Link>
        </div>
      </AccordionRow>
    </section>
  );
}
