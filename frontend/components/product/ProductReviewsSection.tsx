import type { ProductReviewsPayload } from "@/lib/types/reviews";

type ProductReviewsSectionProps = {
  productName: string;
  payload: ProductReviewsPayload | null;
};

/**
 * Renders PDP review summary plus the first page from `GET /v1/products/:slug/reviews`.
 */
export function ProductReviewsSection({ productName, payload }: ProductReviewsSectionProps) {
  if (!payload || payload.summary.totalCount === 0) {
    return (
      <section className="mt-10 rounded-xl border border-line bg-paper p-6" aria-labelledby="pdp-reviews-heading">
        <h2 id="pdp-reviews-heading" className="font-display text-display-md font-semibold text-forest">
          Reviews
        </h2>
        <p className="mt-3 text-body-sm text-ink-muted">
          Buyer reviews will appear here for {productName} once moderated and published.
        </p>
      </section>
    );
  }

  const { summary } = payload;
  return (
    <section className="mt-10 rounded-xl border border-line bg-paper p-6" aria-labelledby="pdp-reviews-heading">
      <h2 id="pdp-reviews-heading" className="font-display text-display-md font-semibold text-forest">
        Reviews
      </h2>
      <p className="mt-2 text-body text-forest">
        <span className="text-gold" aria-hidden>
          ★
        </span>{" "}
        <strong>{summary.averageRating.toFixed(1)}</strong>{" "}
        <span className="text-ink-muted">
          ({summary.totalCount} {summary.totalCount === 1 ? "review" : "reviews"})
        </span>
      </p>
      <ul className="mt-6 space-y-4">
        {payload.reviews.map((r) => (
          <li key={r.id} className="rounded-lg border border-line bg-cream/60 p-4">
            <div className="flex flex-wrap items-baseline gap-2">
              <p className="font-semibold text-forest">{r.authorName}</p>
              {r.isVerified ? (
                <span className="rounded-full bg-olive/20 px-2 py-0.5 font-mono text-eyebrow text-forest">
                  Verified buyer
                </span>
              ) : null}
              <span className="text-gold" aria-label={`Rating ${r.rating} out of 5`}>
                {"★".repeat(r.rating)}
                {"☆".repeat(5 - r.rating)}
              </span>
            </div>
            {r.title ? <p className="mt-2 font-medium text-forest">{r.title}</p> : null}
            <p className="mt-1 text-body text-ink-soft">{r.body}</p>
            {r.adminReply ? (
              <p className="mt-3 rounded-md border border-line bg-paper p-3 text-body-sm text-ink-muted">
                <span className="font-semibold text-forest">DiteUp: </span>
                {r.adminReply}
              </p>
            ) : null}
            <p className="mt-2 text-body-sm text-ink-muted">{new Date(r.createdAt).toLocaleDateString()}</p>
          </li>
        ))}
      </ul>
      {payload.total > payload.reviews.length ? (
        <p className="mt-4 text-body-sm text-ink-muted">Showing {payload.reviews.length} of {payload.total}.</p>
      ) : null}
    </section>
  );
}
