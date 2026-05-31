const faqs = [
  { q: "How long should I soak it?", a: "8 hours overnight for best texture." },
  { q: "Is it vegan?", a: "Use plant milk — recipe is vegan-friendly." },
  { q: "What is the shelf life?", a: "See printed pack; store cool and dry." },
];

/** Static home FAQ copy — shared with FAQPage JSON-LD. */
export const HOME_FAQ_ITEMS = faqs.map((item) => ({
  question: item.q,
  answer: item.a,
}));

/**
 * FAQ accordion-style (static for scaffold; wire Radix later).
 */
export function FaqSection() {
  return (
    <section
      id="faq"
      className="scroll-mt-[104px] bg-cream py-14 md:py-20"
      aria-labelledby="faq-heading"
    >
      <div className="mx-auto max-w-[680px] px-5 md:px-8 lg:px-12">
        <h2
          id="faq-heading"
          className="font-display text-display-lg text-balance text-center font-semibold text-forest"
        >
          FAQ
        </h2>
        <div className="mt-10 space-y-4">
          {faqs.map((item) => (
            <details
              key={item.q}
              className="group rounded-lg border border-line bg-paper px-4 py-3 open:shadow-sm"
            >
              <summary className="cursor-pointer list-none font-semibold text-forest marker:content-none [&::-webkit-details-marker]:hidden">
                {item.q}
              </summary>
              <p className="mt-3 text-body text-ink-soft">{item.a}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
