import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { ReviewModerationActions } from "@/components/admin/ReviewModerationActions";
import { adminGet } from "@/lib/admin-json";

const FILTERS = ["pending", "approved", "flagged", "all"] as const;
type Filter = (typeof FILTERS)[number];

function isFilter(s: string | undefined): s is Filter {
  return FILTERS.includes(s as Filter);
}

type ReviewRow = {
  id: string;
  rating: number;
  title: string | null;
  body: string;
  isApproved: boolean;
  isFlagged: boolean;
  isFeatured: boolean;
  createdAt: string;
  product: { id: string; name: string; slug: string };
  user: { id: string; email: string; name: string | null } | null;
};

type ListResponse = { total: number; page: number; pageSize: number; reviews: ReviewRow[] };

/**
 * Moderation queue — `GET /v1/admin/reviews`.
 */
export default async function AdminReviewsPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const filterRaw = typeof searchParams.filter === "string" ? searchParams.filter : "pending";
  const filter: Filter = isFilter(filterRaw) ? filterRaw : "pending";
  const pageRaw = searchParams.page;
  const page = Math.max(1, Number(typeof pageRaw === "string" ? pageRaw : "1") || 1);

  const qs = new URLSearchParams({
    filter,
    page: String(page),
    pageSize: "25",
  });

  const { data, ok } = await adminGet<ListResponse>(`/v1/admin/reviews?${qs.toString()}`);
  const total = data?.total ?? 0;
  const pageSize = data?.pageSize ?? 25;
  const reviews = data?.reviews ?? [];
  const hasNext = page * pageSize < total;

  const tabHref = (f: Filter) => {
    const n = new URLSearchParams({ filter: f, page: "1" });
    return `/admin/reviews?${n.toString()}`;
  };

  const pageHref = (p: number) => {
    const n = new URLSearchParams({ filter, page: String(p) });
    return `/admin/reviews?${n.toString()}`;
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-display-md font-semibold text-forest">Reviews</h1>
        <p className="mt-1 text-body text-ink-soft">Global moderation — PRD §7.9.5</p>
      </div>

      <nav className="flex flex-wrap gap-2" aria-label="Review filters">
        {FILTERS.map((f) => (
          <Link
            key={f}
            href={tabHref(f)}
            className={`rounded-full px-3 py-1 text-body-sm font-semibold ${
              f === filter ? "bg-forest text-cream" : "border border-line bg-paper text-forest hover:bg-beige/60"
            }`}
          >
            {f}
          </Link>
        ))}
      </nav>

      {!ok ? (
        <p className="text-error">Could not load reviews.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-line bg-paper">
          <table className="min-w-full text-left text-body-sm">
            <thead className="bg-beige/80 font-mono text-eyebrow text-ink-muted">
              <tr>
                <th className="px-4 py-3">Rating</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">Author</th>
                <th className="px-4 py-3">Excerpt</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3 min-w-[200px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {reviews.length === 0 ? (
                <tr className="border-t border-line">
                  <td colSpan={6} className="px-4 py-8 text-center text-ink-muted">
                    No reviews in this queue.
                  </td>
                </tr>
              ) : (
                reviews.map((r) => (
                  <tr key={r.id} className="border-t border-line">
                    <td className="px-4 py-3">{"".padStart(r.rating, "★")}</td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/products/${r.product.id}`} className="font-medium text-gold-deep hover:underline">
                        {r.product.name}
                      </Link>
                    </td>
                    <td className="px-4 py-3">
                      <span className="block">{r.user?.email ?? "Guest"}</span>
                      {r.user?.name ? <span className="text-xs text-ink-muted">{r.user.name}</span> : null}
                    </td>
                    <td className="max-w-xs px-4 py-3 text-ink-muted">
                      <span className="line-clamp-2">{r.title ? `${r.title} — ` : ""}{r.body}</span>
                    </td>
                    <td className="px-4 py-3">
                      {!r.isApproved && r.isFlagged ? (
                        <Badge variant="warning">Flagged</Badge>
                      ) : r.isApproved ? (
                        <Badge variant="success">{r.isFeatured ? "Featured" : "Approved"}</Badge>
                      ) : (
                        <Badge variant="outline">Pending</Badge>
                      )}
                    </td>
                    <td className="px-4 py-3 align-top">
                      <ReviewModerationActions reviewId={r.id} isApproved={r.isApproved} />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      <div className="flex flex-wrap gap-3 text-body-sm">
        {page > 1 ? (
          <Link href={pageHref(page - 1)} className="text-gold-deep underline">
            ← Previous
          </Link>
        ) : null}
        {hasNext ? (
          <Link href={pageHref(page + 1)} className="text-gold-deep underline">
            Next →
          </Link>
        ) : null}
        <span className="text-ink-muted">
          Page {page}
          {ok ? ` · ${total} total` : ""}
        </span>
      </div>
    </div>
  );
}
