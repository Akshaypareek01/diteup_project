import { TestimonialsCarousel } from "@/components/home/TestimonialsCarousel";
import { parseReviewPhotos } from "@/lib/review-images";
import type { ProductReviewsPayload } from "@/lib/types/reviews";

export type TestimonialsSectionProps = {
  reviewsPayload: ProductReviewsPayload | null;
  productName: string;
};

type RatingSummaryProps = {
  average: number;
  totalCount: number;
};

/**
 * Circular average-rating badge for the reviews header.
 *
 * @param average 0–5 mean rating
 * @param totalCount published review count
 */
function RatingSummary({ average, totalCount }: RatingSummaryProps) {
  const pct = Math.min(100, Math.max(0, (average / 5) * 100));

  return (
    <div className="flex shrink-0 items-center gap-4 rounded-lg border border-line bg-paper px-5 py-4 shadow-sm">
      <div
        className="flex size-16 items-center justify-center rounded-full"
        style={{ background: `conic-gradient(#5C8A3A ${String(pct)}%, #D9CFB8 ${String(pct)}%)` }}
        aria-hidden
      >
        <span className="flex size-12 items-center justify-center rounded-full bg-paper font-display text-lg font-semibold text-forest">
          {average.toFixed(1)}
        </span>
      </div>
      <div>
        <p className="text-gold" aria-hidden>
          {"★".repeat(5)}
        </p>
        <p className="mt-0.5 text-body-sm text-ink-muted">
          {totalCount} {totalCount === 1 ? "review" : "reviews"}
        </p>
      </div>
    </div>
  );
}

/**
 * Social proof band — real moderated API reviews on a cream band.
 * Hidden when nothing is published yet.
 */
export function TestimonialsSection({ reviewsPayload, productName }: TestimonialsSectionProps) {
  const hasReviews =
    reviewsPayload != null &&
    reviewsPayload.summary.totalCount > 0 &&
    reviewsPayload.reviews.length > 0;

  if (!hasReviews) return null;

  const summaryCount = reviewsPayload.summary.totalCount;
  const avg = reviewsPayload.summary.averageRating;
  const items = [...reviewsPayload.reviews]
    .sort((a, b) => Number(Boolean(b.hasImages)) - Number(Boolean(a.hasImages)))
    .slice(0, 8)
    .map((review) => ({
      id: review.id,
      name: review.authorName,
      text: review.body,
      rating: review.rating,
      verified: review.isVerified,
      photos: parseReviewPhotos(review.images),
      createdAt: review.createdAt,
      productName,
    }));

  return (
    <section
      id="reviews"
      className="scroll-mt-[104px] border-y border-line/60 bg-cream py-14 md:py-20"
      aria-labelledby="reviews-heading"
    >
      <div className="mx-auto max-w-[1320px] px-5 md:px-8 lg:px-12">
        <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-2xl">
            <p className="inline-flex rounded-full bg-olive/15 px-3 py-1 font-mono text-eyebrow font-semibold uppercase text-forest">
              ★ Trusted across India ★
            </p>
            <h2
              id="reviews-heading"
              className="mt-4 font-display text-display-lg text-balance font-semibold text-forest"
            >
              What Our Customers Say
            </h2>
            <p className="mt-2 font-sans text-body-lg font-semibold text-ink">
              The Love We Earn, One Bite at a Time.
            </p>
            <p className="mt-3 max-w-[52ch] text-body text-ink-soft">
              Real buyers, real packs. Photos from people who soak Energy Bite overnight and eat it in the morning.
            </p>
          </div>
          <RatingSummary average={avg} totalCount={summaryCount} />
        </div>
        <TestimonialsCarousel items={items} />
      </div>
    </section>
  );
}
