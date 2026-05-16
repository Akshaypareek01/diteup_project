import type { ProductReviewsPayload } from "@/lib/types/reviews";

const quotes = [
  { name: "Aditi K.", text: "Finally a breakfast that fits my mornings." },
  { name: "Rahul M.", text: "Tastes clean — not sugary like other mixes." },
  { name: "Neha S.", text: "Shipping was quick and the pack feels premium." },
];

export type TestimonialsSectionProps = {
  reviewsPayload: ProductReviewsPayload | null;
};

/**
 * Social proof band — uses moderated API reviews when available (PRD §6.2.9), else curated fallbacks.
 */
export function TestimonialsSection({ reviewsPayload }: TestimonialsSectionProps) {
  const useApi = reviewsPayload && reviewsPayload.summary.totalCount > 0 && reviewsPayload.reviews.length > 0;
  const summaryCount = useApi ? reviewsPayload!.summary.totalCount : 128;
  const avg = useApi ? reviewsPayload!.summary.averageRating.toFixed(1) : "4.8";
  const list = useApi
    ? reviewsPayload!.reviews.slice(0, 6).map((r) => ({
        name: r.authorName,
        text: r.title ? `${r.title} — ${r.body}` : r.body,
        verified: r.isVerified,
      }))
    : quotes.map((q) => ({ ...q, verified: false }));

  return (
    <section
      id="reviews"
      className="bg-forest py-14 text-cream md:py-20"
      aria-labelledby="reviews-heading"
    >
      <div className="mx-auto max-w-[1320px] px-5 md:px-8 lg:px-12">
        <h2
          id="reviews-heading"
          className="font-display text-display-lg text-balance text-center font-semibold text-cream"
        >
          LOVED BY THOUSANDS
        </h2>
        <p className="mt-3 text-center text-lg text-gold" aria-label={`Average rating ${avg} of 5`}>
          ★★★★★ <span className="text-body-sm text-cream/70">({summaryCount} reviews)</span>
        </p>
        <ul className="mt-10 grid gap-6 md:grid-cols-3">
          {list.map((q) => (
            <li
              key={`${q.name}-${q.text.slice(0, 24)}`}
              className="rounded-lg border border-line-dark/50 bg-sage/80 p-6 shadow-sm backdrop-blur-sm"
            >
              <div className="flex items-center gap-3">
                <div
                  className="flex size-12 shrink-0 items-center justify-center rounded-full bg-gold/25 font-display text-lg font-semibold text-gold"
                  aria-hidden
                >
                  {q.name.charAt(0)}
                </div>
                <div>
                  <p className="font-semibold text-cream">{q.name}</p>
                  <p className="text-body-sm text-cream/70">{q.verified ? "Verified buyer" : "Buyer"}</p>
                </div>
              </div>
              <p className="mt-4 text-body text-cream/85">&ldquo;{q.text}&rdquo;</p>
              <p className="mt-2 text-gold" aria-hidden>
                ★★★★★
              </p>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
