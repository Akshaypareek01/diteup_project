import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { formatInr } from "@/lib/format-money";
import { serverApiFetch, tryGetServerApiBase } from "@/lib/server-api";

/**
 * Admin order list — `GET /v1/admin/orders` (links use internal order `id`).
 */
export default async function AdminOrdersPage() {
  if (!tryGetServerApiBase()) {
    return <p className="text-body text-ink-muted">API base URL not configured.</p>;
  }

  const res = await serverApiFetch("/v1/admin/orders?page=1&pageSize=40");
  if (!res.ok) {
    return (
      <p className="text-body text-error" role="alert">
        Could not load orders ({res.status}).
      </p>
    );
  }

  const data = (await res.json()) as {
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-display-md font-semibold text-forest">Orders</h1>
        <p className="mt-1 text-body text-ink-soft">Fulfillment queue — detail URLs use internal order id.</p>
      </div>
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
                  No orders.
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
    </div>
  );
}
