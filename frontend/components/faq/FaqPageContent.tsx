import { FaqAccordionList } from "@/components/faq/FaqAccordionList";
import { ENERGY_BITE_FAQ_ITEMS } from "@/lib/energy-bite-faqs";

/**
 * Full FAQ page — all Energy Bite questions from policy copy.
 */
export function FaqPageContent() {
  return (
    <div className="mx-auto max-w-[760px] px-5 py-12 md:px-8 md:py-16 lg:px-12">
      <h1 className="font-display text-display-lg text-balance text-center font-semibold text-forest">
        Frequently asked questions
      </h1>
      <p className="mx-auto mt-4 max-w-[52ch] text-center text-body text-ink-soft">
        Quick answers about DiteUp Energy Bite — usage, ingredients, storage, shipping, and returns.
      </p>
      <FaqAccordionList items={ENERGY_BITE_FAQ_ITEMS} className="mt-10" />
    </div>
  );
}
