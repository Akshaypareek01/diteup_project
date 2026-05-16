import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { formatInr } from "@/lib/format-money";
import { serverApiFetch, tryGetServerApiBase } from "@/lib/server-api";

type Props = { params: { id: string } };

/**
 * Admin order detail — `GET /v1/admin/orders/:id` (param is Order CUID).
 */
export default async function AdminOrderDetailPage({ params }: Props) {
  const { id } = params;
  if (!id) notFound();

  if (!tryGetServerApiBase()) {
    return <p className="text-body text-ink-muted">API not configured.</p>;
  }

  const res = await serverApiFetch(`/v1/admin/orders/${encodeURIComponent(id)}`);
  if (res.status === 404) notFound();
  if (!res.ok) {
    return (
      <p className="text-body text-error" role="alert">
        Could not load order ({res.status}).
      </p>
    );
  }

  const detail = (await res.json()) as {
    order: {
      orderNumber: string;
      status: string;
      paymentMethod: string;
      total: number;
      guestEmail: string | null;
      shippingAddress: unknown;
      user: { email?: string; name?: string | null } | null;
    };
    items: Array<{
      id: string;
      productName: string;
      variantName: string;
      quantity: number;
      lineTotal: number;
    }>;
    timeline: Array<{ type: string; at: string; actorId: string | null }>;
  };

  const { order, items, timeline } = detail;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-body-sm text-ink-muted">Order</p>
          <h1 className="font-display text-display-md font-semibold text-forest">{order.orderNumber}</h1>
          <p className="text-body-sm text-ink-muted">
            {order.status} · {order.paymentMethod} · {formatInr(order.total)}
          </p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <h2 className="font-semibold text-forest">Customer &amp; shipping</h2>
          <p className="mt-3 text-body-sm text-forest">
            {order.user?.email ?? order.guestEmail ?? "—"}
            {order.user?.name ? ` · ${order.user.name}` : ""}
          </p>
          <pre className="mt-3 max-h-48 overflow-auto whitespace-pre-wrap rounded border border-line bg-cream p-3 font-sans text-body-sm text-ink-muted">
            {JSON.stringify(order.shippingAddress, null, 2)}
          </pre>
        </Card>
        <Card>
          <h2 className="font-semibold text-forest">Line items</h2>
          <ul className="mt-3 space-y-2 text-body-sm">
            {items.map((it) => (
              <li key={it.id} className="border-b border-line pb-2 last:border-0">
                <span className="font-medium text-forest">{it.productName}</span>
                <span className="text-ink-muted"> — {it.variantName}</span>
                <p className="text-ink-muted">
                  ×{it.quantity} · {formatInr(it.lineTotal)}
                </p>
              </li>
            ))}
          </ul>
        </Card>
        <Card className="lg:col-span-2">
          <h2 className="font-semibold text-forest">Timeline</h2>
          <ul className="mt-3 space-y-2 text-body-sm">
            {timeline.map((e, i) => (
              <li key={`${e.type}-${i}`}>
                <span className="font-medium text-forest">{e.type.replace(/_/g, " ")}</span>
                <span className="text-ink-muted">
                  {" "}
                  · {new Date(e.at).toLocaleString()} {e.actorId ? ` · actor ${e.actorId.slice(0, 8)}…` : ""}
                </span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <Link href="/admin/orders" className="text-body-sm font-medium text-gold-deep hover:underline">
        ← Orders list
      </Link>
    </div>
  );
}
