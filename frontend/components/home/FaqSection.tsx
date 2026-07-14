import Link from "next/link";
import { FaqAccordionList } from "@/components/faq/FaqAccordionList";
import { getHomePreviewFaqItems } from "@/lib/energy-bite-faqs";

const previewFaqs = getHomePreviewFaqItems();

/** First three homepage FAQs — used for FAQPage JSON-LD on the home route. */
export const HOME_FAQ_ITEMS = previewFaqs.map((item) => ({
  question: item.question,
  answer: item.answer,
}));

/**
 * Homepage FAQ preview for `/#faq` — three questions plus link to the full FAQ page.
 */
export function FaqSection() {
  return (
    <section
      id="faq"
      className="scroll-mt-[104px] bg-cream py-14 md:py-20"
      aria-labelledby="faq-heading"
    >
      <div className="mx-auto max-w-[760px] px-5 md:px-8 lg:px-12">
        <h2
          id="faq-heading"
          className="font-display text-display-lg text-balance text-center font-semibold text-forest"
        >
          Frequently asked questions
        </h2>
        <p className="mx-auto mt-4 max-w-[52ch] text-center text-body text-ink-soft">
          Quick answers about DiteUp Energy Bite — usage, ingredients, storage, shipping, and returns.
        </p>
        <FaqAccordionList items={previewFaqs} className="mt-10" />
        <div className="mt-8 flex justify-center">
          <Link
            href="/faq"
            className="inline-flex h-11 min-w-[9rem] items-center justify-center rounded-md border border-forest bg-transparent px-8 font-sans text-sm font-semibold uppercase tracking-wide text-forest transition hover:bg-forest/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
          >
            More
          </Link>
        </div>
      </div>
    </section>
  );
}
