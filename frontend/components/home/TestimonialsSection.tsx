import { TestimonialsCarousel } from "@/components/home/TestimonialsCarousel";
import type { ProductReviewsPayload } from "@/lib/types/reviews";

export type TestimonialsSectionProps = {
  reviewsPayload: ProductReviewsPayload | null;
};

/**
 * Social proof band — renders ONLY real, moderated API reviews.
 * When there are no published reviews yet, the whole band is hidden
 * (no invented quotes, no fake aggregate rating).
 */
export function TestimonialsSection({ reviewsPayload }: TestimonialsSectionProps) {
  const hasReviews =
    reviewsPayload != null &&
    reviewsPayload.summary.totalCount > 0 &&
    reviewsPayload.reviews.length > 0;

  if (!hasReviews) return null;

  const summaryCount = reviewsPayload.summary.totalCount;
  const avg = reviewsPayload.summary.averageRating;
  const items = reviewsPayload.reviews.slice(0, 8).map((review) => ({
    id: review.id,
    name: review.authorName,
    text: review.title ? `${review.title} — ${review.body}` : review.body,
    rating: review.rating,
    verified: review.isVerified,
  }));

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
          LOVED BY OUR CUSTOMERS
        </h2>
        <p className="mt-3 text-center text-lg text-gold" aria-label={`Average rating ${avg.toFixed(1)} of 5`}>
          {avg.toFixed(1)} ★{" "}
          <span className="text-body-sm text-cream/70">
            ({summaryCount} {summaryCount === 1 ? "review" : "reviews"})
          </span>
        </p>
        <TestimonialsCarousel items={items} />
      </div>
    </section>
  );
}
