import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { AdminXlsxUploadForm } from "@/components/admin/AdminXlsxUploadForm";
import { formatInr } from "@/lib/format-money";
import { serverApiFetch, tryGetServerApiBase } from "@/lib/server-api";

const STATUSES = ["", "PLACED", "CONFIRMED", "SHIPPED", "DELIVERED", "CANCELLED", "REFUNDED"] as const;

/**
 * Admin order list — `GET /v1/admin/orders` with search, filters, export.
 */
export default async function AdminOrdersPage({
  searchParams,
}: {
  searchParams: Record<string, string | string[] | undefined>;
}) {
  if (!tryGetServerApiBase()) {
    return <p className="text-body text-ink-muted">API base URL not configured.</p>;
  }

  const qRaw = searchParams.q;
  const q = typeof qRaw === "string" ? qRaw : undefined;
  const statusRaw = searchParams.status;
  const status = typeof statusRaw === "string" ? statusRaw : undefined;
  const pageRaw = searchParams.page;
  const page = Math.max(1, Number(typeof pageRaw === "string" ? pageRaw : "1") || 1);

  const qs = new URLSearchParams({ page: String(page), pageSize: "40" });
  if (q?.trim()) qs.set("q", q.trim());
  if (status?.trim()) qs.set("status", status.trim());

  const res = await serverApiFetch(`/v1/admin/orders?${qs.toString()}`);
  if (!res.ok) {
    return (
      <p className="text-body text-error" role="alert">
        Could not load orders ({res.status}).
      </p>
    );
  }

  const data = (await res.json()) as {
    total: number;
    pageSize: number;
    orders: Array<{
      id: string;
      orderNumber: string;
      guestEmail: string | null;
      total: number;
      status: string;
      paymentMethod: string;
      placedAt: string;
    }>;
  };

  const exportQs = new URLSearchParams();
  if (q?.trim()) exportQs.set("q", q.trim());
  if (status?.trim()) exportQs.set("status", status.trim());
  const exportHref = `/v1/admin/orders/export${exportQs.toString() ? `?${exportQs.toString()}` : ""}`;

  const hasNext = page * data.pageSize < data.total;
  const navQs = (p: number) => {
    const n = new URLSearchParams(qs);
    n.set("page", String(p));
    return `/admin/orders?${n.toString()}`;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-display-md font-semibold text-forest">Orders</h1>
          <p className="mt-1 text-body text-ink-soft">Search, filter, export, and bulk-import status updates.</p>
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

      <form method="get" className="flex flex-wrap items-end gap-3" role="search" aria-label="Filter orders">
        <input type="hidden" name="page" value="1" />
        <label className="sr-only" htmlFor="order-q">
          Search
        </label>
        <input
          id="order-q"
          name="q"
          defaultValue={q ?? ""}
          placeholder="Order #, email…"
          className="h-11 min-w-[200px] rounded-lg border border-line bg-paper px-3 text-body-sm"
        />
        <label className="sr-only" htmlFor="order-status">
          Status
        </label>
        <select
          id="order-status"
          name="status"
          defaultValue={status ?? ""}
          className="h-11 rounded-lg border border-line bg-paper px-3 text-body-sm"
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

      <Card>
        <h2 className="font-semibold text-forest">Bulk import status</h2>
        <p className="mt-1 text-body-sm text-ink-muted">XLSX columns: orderNumber, status</p>
        <div className="mt-4">
          <AdminXlsxUploadForm uploadPath="/v1/admin/orders/import" label="Import order statuses" />
        </div>
      </Card>

      <div className="overflow-x-auto rounded-lg border border-line bg-paper">
        <table className="min-w-full text-left text-body-sm">
          <thead className="bg-beige/80 font-mono text-eyebrow text-ink-muted">
            <tr>
              <th className="px-4 py-3">Order #</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Total</th>
              <th className="px-4 py-3">Payment</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Placed</th>
            </tr>
          </thead>
          <tbody>
            {data.orders.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-4 py-8 text-center text-ink-muted">
                  No orders match.
                </td>
              </tr>
            ) : (
              data.orders.map((o) => (
                <tr key={o.id} className="border-t border-line">
                  <td className="px-4 py-3 font-mono">
                    <Link
                      href={`/admin/orders/${encodeURIComponent(o.id)}`}
                      className="font-semibold text-gold-deep hover:underline"
                    >
                      {o.orderNumber}
                    </Link>
                  </td>
                  <td className="px-4 py-3">{o.guestEmail ?? "—"}</td>
                  <td className="px-4 py-3">{formatInr(o.total)}</td>
                  <td className="px-4 py-3">{o.paymentMethod}</td>
                  <td className="px-4 py-3">
                    <Badge variant="outline">{o.status}</Badge>
                  </td>
                  <td className="px-4 py-3 text-ink-muted">{new Date(o.placedAt).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap gap-3 text-body-sm">
        {page > 1 ? (
          <Link href={navQs(page - 1)} className="text-gold-deep underline">
            ← Previous
          </Link>
        ) : null}
        {hasNext ? (
          <Link href={navQs(page + 1)} className="text-gold-deep underline">
            Next →
          </Link>
        ) : null}
        <span className="text-ink-muted">
          Page {page} · {data.total} total
        </span>
      </div>
    </div>
  );
}
