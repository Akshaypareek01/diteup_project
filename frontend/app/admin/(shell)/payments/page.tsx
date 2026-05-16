import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { formatInr } from "@/lib/format-money";
import { adminGet } from "@/lib/admin-json";

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
 * Payment ledger — `GET /v1/admin/payments`.
 */
export default async function AdminPaymentsPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  const pageRaw = searchParams.page;
  const page = Math.max(1, Number(typeof pageRaw === "string" ? pageRaw : "1") || 1);
  const qs = new URLSearchParams({ page: String(page), pageSize: "25" });

  const { data, ok } = await adminGet<ListResponse>(`/v1/admin/payments?${qs.toString()}`);
  const total = data?.total ?? 0;
  const pageSize = data?.pageSize ?? 25;
  const rows = data?.payments ?? [];
  const hasNext = page * pageSize < total;
  const nav = (p: number) => `/admin/payments?page=${p}`;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-display-md font-semibold text-forest">Payments</h1>
        <p className="mt-1 text-body text-ink-soft">PRD §7.4 — manual refunds from the detail view.</p>
      </div>
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
                    No payments yet.
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
