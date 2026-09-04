"use client";

import { useCallback, useState } from "react";
import { ReviewPhotoStrip } from "@/components/reviews/ReviewPhotoStrip";
import { Button } from "@/components/ui/Button";
import { ApiError, clientApiJson } from "@/lib/client-api";
import { parseReviewPhotos } from "@/lib/review-images";
import {
  PDP_REVIEW_PAGE_SIZE,
  type ProductReviewsPayload,
  type PublicReviewItem,
} from "@/lib/types/reviews";

type ProductPdpReviewListProps = {
  productSlug: string;
  initialReviews: PublicReviewItem[];
  initialPage: number;
  total: number;
};

type ReviewCardProps = {
  review: PublicReviewItem;
};

/** Compact five-star row for a single review card. */
function StarRow({ rating }: { rating: number }) {
  const full = Math.round(Math.min(5, Math.max(0, rating)));
  const empty = Math.max(0, 5 - full);
  const starPath =
    "M12 2.75 14.74 9.14h6.93l-5.61 4.06 2.13 6.59L12 16.93l-5.18 3.87 2.13-6.59L3.34 9.14h6.93L12 2.75z";

  return (
    <span className="inline-flex items-center gap-0.5 text-gold-deep" aria-hidden>
      {Array.from({ length: full }, (_, i) => (
        <svg key={`f-${String(i)}`} className="size-3.5" viewBox="0 0 24 24" fill="currentColor">
          <path d={starPath} />
        </svg>
      ))}
      {Array.from({ length: empty }, (_, i) => (
        <svg key={`e-${String(i)}`} className="size-3.5 text-line-dark/35" viewBox="0 0 24 24" fill="none">
          <path d={starPath} stroke="currentColor" strokeWidth="1.45" />
        </svg>
      ))}
    </span>
  );
}

/**
 * One published review in the PDP list.
 */
function ReviewCard({ review }: ReviewCardProps) {
  return (
    <li className="rounded-lg border border-line bg-cream/60 p-4">
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
        <StarRow rating={review.rating} />
      </div>
      {review.title ? <p className="mt-2 font-medium text-forest">{review.title}</p> : null}
      <p className="mt-1 text-body text-ink-soft">{review.body}</p>
      <ReviewPhotoStrip
        photos={parseReviewPhotos(review.images)}
        authorName={review.authorName}
        layout="row"
        className="mt-3"
      />
      {review.adminReply ? (
        <p className="mt-3 rounded-md border border-line bg-paper p-3 text-body-sm text-ink-muted">
          <span className="font-semibold text-forest">DiteUp: </span>
          {review.adminReply}
        </p>
      ) : null}
    </li>
  );
}

/**
 * Fetches the next page of approved reviews for a product slug.
 */
async function fetchReviewPage(slug: string, page: number): Promise<ProductReviewsPayload> {
  const qp = new URLSearchParams({
    page: String(page),
    pageSize: String(PDP_REVIEW_PAGE_SIZE),
    sort: "recent",
  });
  return clientApiJson<ProductReviewsPayload>(
    `/v1/products/${encodeURIComponent(slug)}/reviews?${qp.toString()}`,
    { method: "GET" },
  );
}

/**
 * Appends unique reviews from a page onto the currently visible list.
 */
function mergeReviews(current: PublicReviewItem[], incoming: PublicReviewItem[]): PublicReviewItem[] {
  const seen = new Set(current.map((review) => review.id));
  return [...current, ...incoming.filter((review) => !seen.has(review.id))];
}

/**
 * Paginated PDP review list: first page from SSR, then 5 more per click from the public API.
 */
export function ProductPdpReviewList({
  productSlug,
  initialReviews,
  initialPage,
  total,
}: ProductPdpReviewListProps) {
  const [items, setItems] = useState(initialReviews);
  const [page, setPage] = useState(initialPage);
  const [totalCount, setTotalCount] = useState(total);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const remaining = Math.max(0, totalCount - items.length);
  const nextBatch = Math.min(PDP_REVIEW_PAGE_SIZE, remaining);
  const hasMore = remaining > 0;

  /**
   * Loads the next page of reviews from `GET /v1/products/:slug/reviews`.
   */
  const loadMore = useCallback(async () => {
    if (loading || remaining <= 0) return;
    setLoading(true);
    setError(null);
    try {
      const data = await fetchReviewPage(productSlug, page + 1);
      const incoming = data.reviews;
      setTotalCount(incoming.length === 0 ? items.length : data.total);
      setItems((current) => mergeReviews(current, incoming));
      setPage(data.page);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Could not load more reviews.");
    } finally {
      setLoading(false);
    }
  }, [loading, remaining, productSlug, page, items.length]);

  return (
    <div className="mt-8">
      <ul className="space-y-4" aria-label="Customer reviews" aria-busy={loading}>
        {items.map((review) => (
          <ReviewCard key={review.id} review={review} />
        ))}
      </ul>

      {hasMore ? (
        <div className="mt-6 flex flex-col items-center gap-2">
          <Button
            type="button"
            variant="secondary"
            size="md"
            className="rounded-full px-6"
            disabled={loading}
            aria-label={`Show ${nextBatch} more reviews`}
            onClick={() => {
              void loadMore();
            }}
          >
            {loading ? "Loading…" : `Show ${nextBatch} more`}
          </Button>
          {error ? (
            <p className="text-center text-body-sm text-error" role="alert">
              {error}
            </p>
          ) : null}
        </div>
      ) : null}
    </div>
  );
}
