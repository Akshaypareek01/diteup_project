import type { EnergyBiteFaqItem } from "@/lib/energy-bite-faqs";
import { cn } from "@/lib/utils";

export type FaqAccordionListProps = {
  items: EnergyBiteFaqItem[];
  className?: string;
};

/**
 * Accessible FAQ accordion list using native `<details>` elements.
 */
export function FaqAccordionList({ items, className }: FaqAccordionListProps) {
  return (
    <div className={cn("space-y-4", className)}>
      {items.map((item) => (
        <details
          key={item.question}
          className="group rounded-lg border border-line bg-paper px-4 py-3 open:shadow-sm"
        >
          <summary className="cursor-pointer list-none font-semibold text-forest marker:content-none [&::-webkit-details-marker]:hidden">
            {item.question}
          </summary>
          <p className="mt-3 text-body text-ink-soft">{item.answer}</p>
        </details>
      ))}
    </div>
  );
}
