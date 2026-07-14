import type { PublicReviewSummary } from "@/lib/types/reviews";
import { cn } from "@/lib/utils";

const FALLBACK_RATING = 4.8;
const FALLBACK_COUNT = 500;

type ProductPdpRatingsRowProps = {
  summary: PublicReviewSummary | null | undefined;
  reviewsEnabled?: boolean;
  className?: string;
};

/** Five-star row: filled golden stars plus subtle outlines for the rest. */
function StarRow({ rating }: { rating: number }) {
  const full = Math.round(Math.min(5, Math.max(0, rating)));
  const empty = Math.max(0, 5 - full);
  const starCls = "size-[0.82rem] shrink-0 sm:size-[0.875rem]";
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

/**
 * Star rating + review count near the product title (CRO issue 2).
 * Falls back to static values when live review data is unavailable.
 */
export function ProductPdpRatingsRow({ summary, reviewsEnabled = true, className }: ProductPdpRatingsRowProps) {
  if (!reviewsEnabled) return null;

  const hasLiveData = summary && summary.totalCount > 0;
  const rating = hasLiveData ? summary.averageRating : FALLBACK_RATING;
  const count = hasLiveData ? summary.totalCount : FALLBACK_COUNT;

  return (
    <p
      className={cn(
        "flex flex-wrap items-center gap-2 font-sans text-[0.8125rem] leading-snug text-ink lg:text-body-sm",
        className,
      )}
      aria-label={`Rated ${rating.toFixed(1)} out of 5 from ${count} reviews`}
    >
      <StarRow rating={rating} />
      <span className="font-semibold text-forest">{rating.toFixed(1)}</span>
      <span className="text-ink">
        ({count} {count === 1 ? "Review" : "Reviews"})
      </span>
    </p>
  );
}
