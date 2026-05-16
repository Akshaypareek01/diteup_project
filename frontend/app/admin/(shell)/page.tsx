import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { formatInr } from "@/lib/format-money";
import { serverApiFetch, tryGetServerApiBase } from "@/lib/server-api";

type DashboardStats = {
  ordersLast7Days: number;
  ordersLast30Days: number;
  gmvLast30Days: number;
  customerCount: number;
  reviewsPendingModeration: number;
  lowStockVariants: unknown[];
  ordersByStatus: Record<string, number>;
};

/**
 * Admin home — live KPIs + recent orders from `/v1/admin/*`.
 */
export default async function AdminDashboardPage() {
  if (!tryGetServerApiBase()) {
    return <p className="text-body text-ink-muted">Configure API_INTERNAL_URL / NEXT_PUBLIC_API_URL.</p>;
  }

  const [statsRes, ordersRes] = await Promise.all([
    serverApiFetch("/v1/admin/dashboard/stats"),
    serverApiFetch("/v1/admin/orders?page=1&pageSize=6"),
  ]);

  if (!statsRes.ok) {
    return (
      <p className="text-body text-error" role="alert">
        Could not load dashboard stats ({statsRes.status}).
      </p>
    );
  }

  const stats = (await statsRes.json()) as DashboardStats;
  const recent =
    ordersRes.ok
      ? ((await ordersRes.json()) as {
          orders: Array<{
            id: string;
            orderNumber: string;
            guestEmail: string | null;
            total: number;
            status: string;
            placedAt: string;
          }>;
        })
      : { orders: [] };

  const kpis = [
    { label: "Orders (7d)", value: String(stats.ordersLast7Days) },
    { label: "Orders (30d)", value: String(stats.ordersLast30Days) },
    { label: "GMV (30d)", value: formatInr(stats.gmvLast30Days) },
    { label: "Customers", value: String(stats.customerCount) },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-display-md font-semibold text-forest">Dashboard</h1>
        <p className="mt-1 text-body text-ink-soft">Live aggregates from the API.</p>
      </div>

      <section aria-label="KPI tiles" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpis.map((k) => (
          <Card key={k.label}>
            <p className="font-mono text-eyebrow text-ink-muted">{k.label}</p>
            <p className="mt-2 font-display text-3xl font-semibold text-forest">{k.value}</p>
          </Card>
        ))}
      </section>

      <Card>
        <p className="font-mono text-eyebrow text-ink-muted">Pending tasks</p>
        <p className="mt-2 text-body-sm text-forest">
          Reviews awaiting moderation: <strong>{stats.reviewsPendingModeration}</strong>
        </p>
        <p className="mt-1 text-body-sm text-forest">
          Low-stock inventory rows: <strong>{stats.lowStockVariants.length}</strong>
        </p>
      </Card>

      <section aria-labelledby="recent-orders">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 id="recent-orders" className="font-display text-xl font-semibold text-forest">
            Recent orders
          </h2>
          <Link href="/admin/orders" className="text-body-sm font-semibold text-gold-deep hover:underline">
            View all
          </Link>
        </div>
        <div className="mt-4 overflow-x-auto rounded-lg border border-line bg-paper">
          <table className="min-w-full text-left text-body-sm">
            <thead className="bg-beige/80 font-mono text-eyebrow text-ink-muted">
              <tr>
                <th className="px-4 py-3">Order</th>
                <th className="px-4 py-3">Customer</th>
                <th className="px-4 py-3">Total</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Placed</th>
              </tr>
            </thead>
            <tbody>
              {recent.orders.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-6 text-center text-ink-muted">
                    No orders yet.
                  </td>
                </tr>
              ) : (
                recent.orders.map((o) => (
                  <tr key={o.id} className="border-t border-line">
                    <td className="px-4 py-3 font-mono">
                      <Link
                        href={`/admin/orders/${encodeURIComponent(o.id)}`}
                        className="text-gold-deep hover:underline"
                      >
                        {o.orderNumber}
                      </Link>
                    </td>
                    <td className="px-4 py-3">{o.guestEmail ?? "—"}</td>
                    <td className="px-4 py-3">{formatInr(o.total)}</td>
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
      </section>
    </div>
  );
}
