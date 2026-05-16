import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { formatInr } from "@/lib/format-money";
import { adminGet } from "@/lib/admin-json";

type CouponRow = {
  id: string;
  code: string;
  type: string;
  value: number;
  usedCount: number;
  usageLimit: number | null;
  isActive: boolean;
};

type ListResponse = { total: number; page: number; pageSize: number; coupons: CouponRow[] };

/**
 * Coupons — `GET /v1/admin/coupons`.
 */
export default async function AdminCouponsPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const pageRaw = searchParams.page;
  const page = Math.max(1, Number(typeof pageRaw === "string" ? pageRaw : "1") || 1);
  const qs = new URLSearchParams({ page: String(page), pageSize: "30" });

  const { data, ok } = await adminGet<ListResponse>(`/v1/admin/coupons?${qs.toString()}`);
  const total = data?.total ?? 0;
  const pageSize = data?.pageSize ?? 30;
  const rows = data?.coupons ?? [];
  const hasNext = page * pageSize < total;

  return (
    <div className="space-y-6">
      <h1 className="font-display text-display-md font-semibold text-forest">Coupons</h1>
      {!ok ? (
        <p className="text-error">Could not load coupons.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-line bg-paper">
          <table className="min-w-full text-left text-body-sm">
            <thead className="bg-beige/80 font-mono text-eyebrow text-ink-muted">
              <tr>
                <th className="px-4 py-3">Code</th>
                <th className="px-4 py-3">Type</th>
                <th className="px-4 py-3">Value</th>
                <th className="px-4 py-3">Used / limit</th>
                <th className="px-4 py-3">Status</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr className="border-t border-line">
                  <td colSpan={5} className="px-4 py-8 text-center text-ink-muted">
                    No coupons yet.
                  </td>
                </tr>
              ) : (
                rows.map((c) => (
                  <tr key={c.id} className="border-t border-line">
                    <td className="px-4 py-3 font-mono font-semibold">
                      <Link href={`/admin/coupons/${c.id}`} className="text-gold-deep hover:underline">
                        {c.code}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{c.type}</td>
                    <td className="px-4 py-3">
                      {c.type === "PERCENT" ? `${c.value}%` : c.type === "FLAT" ? formatInr(c.value) : c.type}
                    </td>
                    <td className="px-4 py-3">
                      {c.usedCount}
                      {c.usageLimit != null ? ` / ${c.usageLimit}` : " / ∞"}
                    </td>
                    <td className="px-4 py-3">
                      {c.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="warning">Off</Badge>}
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
          <Link href={`/admin/coupons?page=${page - 1}`} className="text-gold-deep underline">
            ← Previous
          </Link>
        ) : null}
        {hasNext ? (
          <Link href={`/admin/coupons?page=${page + 1}`} className="text-gold-deep underline">
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
