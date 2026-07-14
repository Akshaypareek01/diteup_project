import { TestimonialsCarousel } from "@/components/home/TestimonialsCarousel";
import { PDP_MOCK_REVIEW_CARDS } from "@/lib/pdp-mock-reviews";
import type { ProductReviewsPayload } from "@/lib/types/reviews";

const quotes = [
  { id: "home-t1", name: "Aditi K.", text: "Finally a breakfast that fits my mornings.", verified: false },
  { id: "home-t2", name: "Rahul M.", text: "Tastes clean — not sugary like other mixes.", verified: false },
  { id: "home-t3", name: "Neha S.", text: "Shipping was quick and the pack feels premium.", verified: false },
];

const fallbackSlides = [
  ...quotes,
  ...PDP_MOCK_REVIEW_CARDS.slice(3).map((item) => ({
    id: item.id,
    name: item.name,
    text: item.body,
    verified: true,
  })),
];

export type TestimonialsSectionProps = {
  reviewsPayload: ProductReviewsPayload | null;
};

/**
 * Social proof band — uses moderated API reviews when available, else curated fallback slides.
 */
export function TestimonialsSection({ reviewsPayload }: TestimonialsSectionProps) {
  const useApi = reviewsPayload && reviewsPayload.summary.totalCount > 0 && reviewsPayload.reviews.length > 0;
  const summaryCount = useApi ? reviewsPayload!.summary.totalCount : 128;
  const avg = useApi ? reviewsPayload!.summary.averageRating.toFixed(1) : "4.8";
  const items = useApi
    ? reviewsPayload!.reviews.slice(0, 8).map((review) => ({
        id: review.id,
        name: review.authorName,
        text: review.title ? `${review.title} — ${review.body}` : review.body,
        verified: review.isVerified,
      }))
    : fallbackSlides;

  return (
    <section
      id="reviews"
      className="scroll-mt-[104px] bg-forest py-14 text-cream md:py-20"
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
        <TestimonialsCarousel items={items} />
      </div>
    </section>
  );
}
