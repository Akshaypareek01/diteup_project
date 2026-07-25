import { ProductPdpReviewSlides } from "@/components/product/ProductPdpReviewSlides";
import { Button } from "@/components/ui/Button";
import type { ProductReviewsPayload } from "@/lib/types/reviews";
import { cn } from "@/lib/utils";

type ProductPdpReviewsProps = {
  productName: string;
  reviewsEnabled?: boolean;
  payload: ProductReviewsPayload | null;
  className?: string;
};

/** Five-star row for review summary. */
function StarRow({ rating, size = "md" }: { rating: number; size?: "sm" | "md" }) {
  const full = Math.round(Math.min(5, Math.max(0, rating)));
  const empty = Math.max(0, 5 - full);
  const starCls = size === "sm" ? "size-3.5" : "size-5";
  const starPath =
    "M12 2.75 14.74 9.14h6.93l-5.61 4.06 2.13 6.59L12 16.93l-5.18 3.87 2.13-6.59L3.34 9.14h6.93L12 2.75z";

  return (
    <span className="inline-flex items-center gap-0.5 text-gold-deep" aria-hidden>
      {Array.from({ length: full }, (_, i) => (
        <svg key={`f-${String(i)}`} className={starCls} viewBox="0 0 24 24" fill="currentColor">
          <path d={starPath} />
        </svg>
      ))}
      {Array.from({ length: empty }, (_, i) => (
        <svg key={`e-${String(i)}`} className={`${starCls} text-line-dark/35`} viewBox="0 0 24 24" fill="none">
          <path d={starPath} stroke="currentColor" strokeWidth="1.45" />
        </svg>
      ))}
    </span>
  );
}

type DistributionBarProps = {
  stars: number;
  count: number;
  maxCount: number;
};

/** Horizontal bar for one star rating bucket. */
function DistributionBar({ stars, count, maxCount }: DistributionBarProps) {
  const widthPct = maxCount > 0 ? Math.round((count / maxCount) * 100) : 0;

  return (
    <li className="grid grid-cols-[2.5rem_1fr_2rem] items-center gap-2 text-body-sm">
      <span className="text-ink-muted">{stars} ★</span>
      <div className="h-2 overflow-hidden rounded-full bg-line/60">
        <div
          className="h-full rounded-full bg-[#C5D99A] transition-all"
          style={{ width: `${String(widthPct)}%` }}
          role="presentation"
        />
      </div>
      <span className="text-right tabular-nums text-ink-muted">{count}</span>
    </li>
  );
}

/**
 * Full ratings & reviews section with distribution, review carousel, and write-review CTA.
 */
export function ProductPdpReviews({ productName, reviewsEnabled = true, payload, className }: ProductPdpReviewsProps) {
  if (!reviewsEnabled) return null;

  const hasLiveData = Boolean(payload && payload.summary.totalCount > 0);
  const summary = hasLiveData ? payload!.summary : null;
  const reviewItems = payload?.reviews ?? [];

  return (
    <section
      aria-labelledby="pdp-reviews-heading"
      className={cn("rounded-2xl border border-line bg-paper p-5 sm:p-6 lg:p-8", className)}
    >
      <h2 id="pdp-reviews-heading" className="text-center font-display text-display-md font-semibold text-forest">
        Ratings &amp; Reviews
      </h2>

      {summary ? (
        <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_1.2fr_auto] lg:items-center lg:gap-8">
          <div className="text-center lg:text-left">
            <StarRow rating={summary.averageRating} />
            <p className="mt-2 font-sans text-body-lg font-semibold text-ink">
              {summary.averageRating.toFixed(2)} out of 5
            </p>
            <p className="mt-1 flex items-center justify-center gap-1.5 font-sans text-body-sm text-ink-muted lg:justify-start">
              Based on {summary.totalCount} {summary.totalCount === 1 ? "review" : "reviews"}
              <svg className="size-4 text-success" viewBox="0 0 24 24" fill="currentColor" aria-label="Verified">
                <path d="M9 12.5 10.75 14.25 15 10M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
              </svg>
            </p>
          </div>

          <ul className="space-y-1.5" aria-label="Rating distribution">
            {([5, 4, 3, 2, 1] as const).map((stars) => (
              <DistributionBar
                key={stars}
                stars={stars}
                count={summary.distribution[stars]}
                maxCount={Math.max(...Object.values(summary.distribution))}
              />
            ))}
          </ul>

          <div className="flex justify-center lg:justify-end">
            <Button href="/account/reviews/new" variant="primaryForest" size="md" className="rounded-full px-6">
              Write a product review
            </Button>
          </div>
        </div>
      ) : (
        <div className="mt-6 flex justify-center">
          <Button href="/account/reviews/new" variant="primaryForest" size="md" className="rounded-full px-6">
            Write a product review
          </Button>
        </div>
      )}

      <ProductPdpReviewSlides reviews={reviewItems} className="mt-8" />

      {reviewItems.length > 0 ? (
        <ul className="mt-8 space-y-4" aria-label="Customer reviews">
          {reviewItems.map((review) => (
            <li key={review.id} className="rounded-lg border border-line bg-cream/60 p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="font-semibold text-forest">{review.authorName}</p>
                  {review.isVerified ? (
                    <span className="rounded-full bg-olive/20 px-2 py-0.5 font-mono text-eyebrow text-forest">
                      Verified
                    </span>
                  ) : null}
                </div>
                <time className="text-body-sm text-ink-muted" dateTime={review.createdAt}>
                  {new Date(review.createdAt).toLocaleDateString()}
                </time>
              </div>
              <div className="mt-2">
                <StarRow rating={review.rating} size="sm" />
              </div>
              {review.title ? <p className="mt-2 font-medium text-forest">{review.title}</p> : null}
              <p className="mt-1 text-body text-ink-soft">{review.body}</p>
              {review.adminReply ? (
                <p className="mt-3 rounded-md border border-line bg-paper p-3 text-body-sm text-ink-muted">
                  <span className="font-semibold text-forest">DiteUp: </span>
                  {review.adminReply}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-8 text-center text-body-sm text-ink-muted">
          Buyer reviews for {productName} will appear here once moderated and published.
        </p>
      )}

      {payload && payload.total > payload.reviews.length ? (
        <p className="mt-4 text-center text-body-sm text-ink-muted">
          Showing {payload.reviews.length} of {payload.total} reviews.
        </p>
      ) : null}
    </section>
  );
}
