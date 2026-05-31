import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { formatInr } from "@/lib/format-money";
import { adminGet } from "@/lib/admin-json";

const STATUSES = ["", "CREATED", "AUTHORIZED", "CAPTURED", "FAILED", "REFUNDED", "PARTIALLY_REFUNDED"] as const;

type PaymentRow = {
  id: string;
  orderId: string;
  status: string;
  method: string;
  amount: number;
  refundedAmount: number;
  createdAt: string;
  order: {
    id: string;
    orderNumber: string;
    status: string;
    paymentMethod: string;
    total: number;
  } | null;
};

type ListResponse = { total: number; page: number; pageSize: number; payments: PaymentRow[] };

/**
 * Payment ledger — filter, paginate, export.
 */
export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const statusRaw = searchParams.status;
  const status = typeof statusRaw === "string" ? statusRaw : undefined;
  const qRaw = searchParams.q;
  const q = typeof qRaw === "string" ? qRaw : undefined;
  const pageRaw = searchParams.page;
  const page = Math.max(1, Number(typeof pageRaw === "string" ? pageRaw : "1") || 1);

  const qs = new URLSearchParams({ page: String(page), pageSize: "25" });
  if (status?.trim()) qs.set("status", status.trim());
  if (q?.trim()) qs.set("q", q.trim());

  const { data, ok } = await adminGet<ListResponse>(`/v1/admin/payments?${qs.toString()}`);
  const total = data?.total ?? 0;
  const pageSize = data?.pageSize ?? 25;
  const rows = data?.payments ?? [];
  const hasNext = page * pageSize < total;

  const exportQs = new URLSearchParams();
  if (status?.trim()) exportQs.set("status", status.trim());
  if (q?.trim()) exportQs.set("q", q.trim());
  const exportHref = `/v1/admin/payments/export${exportQs.toString() ? `?${exportQs.toString()}` : ""}`;

  const nav = (p: number) => {
    const n = new URLSearchParams(qs);
    n.set("page", String(p));
    return `/admin/payments?${n.toString()}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-display-md font-semibold text-forest">Payments</h1>
          <p className="mt-1 text-body text-ink-soft">Filter by status; export to Excel; refund from detail view.</p>
        </div>
        <a
          href={exportHref}
          className="inline-flex h-11 items-center justify-center rounded-lg border border-forest bg-transparent px-4 font-sans text-button font-semibold uppercase tracking-wide text-forest"
          target="_blank"
          rel="noreferrer"
        >
          Export XLSX
        </a>
      </div>

      <form method="get" className="flex flex-wrap items-end gap-3" role="search" aria-label="Filter payments">
        <input type="hidden" name="page" value="1" />
        <input
          id="pay-q"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Payment / Razorpay ID…"
          className="h-11 min-w-[200px] rounded-lg border border-line bg-paper px-3 text-body-sm"
          aria-label="Search payments"
        />
        <select
          id="pay-status"
          name="status"
          defaultValue={status ?? ""}
          className="h-11 rounded-lg border border-line bg-paper px-3 text-body-sm"
          aria-label="Payment status"
        >
          {STATUSES.map((s) => (
            <option key={s || "all"} value={s}>
              {s ? s.replace(/_/g, " ") : "All statuses"}
            </option>
          ))}
        </select>
        <button
          type="submit"
          className="h-11 rounded-lg bg-forest px-4 font-sans text-button font-semibold uppercase tracking-wide text-cream"
        >
          Apply
        </button>
      </form>

      {!ok ? (
        <p className="text-error">Could not load payments.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-line bg-paper">
          <table className="min-w-full text-left text-body-sm">
            <thead className="bg-beige/80 font-mono text-eyebrow text-ink-muted">
              <tr>
                <th className="px-4 py-3">Payment ID</th>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Method</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Created</th>
              </tr>
            </thead>
            <tbody>
              {rows.length === 0 ? (
                <tr className="border-t border-line">
                  <td colSpan={6} className="px-4 py-8 text-center text-ink-muted">
                    No payments match.
                  </td>
                </tr>
              ) : (
                rows.map((p) => (
                  <tr key={p.id} className="border-t border-line">
                    <td className="px-4 py-3 font-mono">
                      <Link href={`/admin/payments/${p.id}`} className="text-gold-deep hover:underline">
                        {p.id.slice(0, 12)}…
                      </Link>
                    </td>
                    <td className="px-4 py-3 font-mono">
                      {p.order ? (
                        <Link href={`/admin/orders/${p.order.id}`} className="text-gold-deep hover:underline">
                          {p.order.orderNumber}
                        </Link>
                      ) : (
                        "—"
                      )}
                    </td>
                    <td className="px-4 py-3">{p.method}</td>
                    <td className="px-4 py-3">
                      <Badge variant={p.status === "CAPTURED" ? "success" : "outline"}>{p.status}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <span>{formatInr(p.amount)}</span>
                      {p.refundedAmount > 0 ? (
                        <span className="ml-1 text-xs text-ink-muted">(ref {formatInr(p.refundedAmount)})</span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-ink-muted">{new Date(p.createdAt).toLocaleString()}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      <div className="flex flex-wrap gap-3 text-body-sm">
        {page > 1 ? (
          <Link href={nav(page - 1)} className="text-gold-deep underline">
            ← Previous
          </Link>
        ) : null}
        {hasNext ? (
          <Link href={nav(page + 1)} className="text-gold-deep underline">
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
