import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { PaymentRefundPanel } from "@/components/admin/PaymentRefundPanel";
import { formatInr } from "@/lib/format-money";
import { adminGet } from "@/lib/admin-json";

type PaymentDetail = {
  id: string;
  orderId: string;
  status: string;
  method: string;
  amount: number;
  refundedAmount: number;
  razorpayOrderId: string | null;
  razorpayPaymentId: string | null;
  failureReason: string | null;
  rawPayload: unknown;
  createdAt: string;
  updatedAt: string;
};

type OrderCtx = {
  id: string;
  orderNumber: string;
  status: string;
  total: number;
  items: { sku: string; quantity: number; lineTotal: unknown }[];
} | null;

type DetailResponse = { payment: PaymentDetail; order: OrderCtx };

type Props = { params: { paymentId: string } };

/**
 * Payment drill-down — `GET /v1/admin/payments/:id`.
 */
export default async function AdminPaymentDetailPage({ params }: Props) {
  const { paymentId } = params;
  const { data, ok } = await adminGet<DetailResponse>(`/v1/admin/payments/${encodeURIComponent(paymentId)}`);
  if (!ok || !data?.payment) notFound();

  const p = data.payment;
  const refundable = p.status === "CAPTURED" || p.status === "PARTIALLY_REFUNDED";
  const rawJson = JSON.stringify(p.rawPayload ?? null, null, 2);

  return (
    <div className="space-y-6">
      <h1 className="font-display text-display-md font-semibold text-forest">Payment</h1>
      <p className="font-mono text-body-sm text-ink-muted">{p.id}</p>
      <Card>
        <div className="flex flex-wrap gap-2 text-body-sm">
          <Badge variant="outline">{p.method}</Badge>
          <Badge variant={p.status === "CAPTURED" ? "success" : "outline"}>{p.status}</Badge>
        </div>
        <dl className="mt-4 grid gap-2 text-body-sm sm:grid-cols-2">
          <div>
            <dt className="font-mono text-eyebrow text-ink-muted">Amount</dt>
            <dd>{formatInr(p.amount)}</dd>
          </div>
          <div>
            <dt className="font-mono text-eyebrow text-ink-muted">Refunded</dt>
            <dd>{formatInr(p.refundedAmount)}</dd>
          </div>
          <div>
            <dt className="font-mono text-eyebrow text-ink-muted">Razorpay order</dt>
            <dd className="break-all font-mono text-xs">{p.razorpayOrderId ?? "—"}</dd>
          </div>
          <div>
            <dt className="font-mono text-eyebrow text-ink-muted">Razorpay payment</dt>
            <dd className="break-all font-mono text-xs">{p.razorpayPaymentId ?? "—"}</dd>
          </div>
          <div>
            <dt className="font-mono text-eyebrow text-ink-muted">Failure</dt>
            <dd>{p.failureReason ?? "—"}</dd>
          </div>
          <div>
            <dt className="font-mono text-eyebrow text-ink-muted">Times</dt>
            <dd>
              {new Date(p.createdAt).toLocaleString()} → {new Date(p.updatedAt).toLocaleString()}
            </dd>
          </div>
        </dl>
        {data.order ? (
          <p className="mt-4 text-body-sm">
            Order{" "}
            <Link href={`/admin/orders/${data.order.id}`} className="font-semibold text-gold-deep underline">
              {data.order.orderNumber}
            </Link>{" "}
            · {data.order.status} · {formatInr(data.order.total)}
          </p>
        ) : null}
        <details className="mt-4">
          <summary className="cursor-pointer font-semibold text-forest">Webhook / raw payload</summary>
          <pre className="mt-2 max-h-80 overflow-auto rounded border border-line bg-beige/40 p-3 font-mono text-xs">{rawJson}</pre>
        </details>
        <PaymentRefundPanel paymentId={p.id} refundable={refundable} />
      </Card>
      <Link href="/admin/payments" className="text-body-sm text-gold-deep hover:underline">
        ← Payments
      </Link>
    </div>
  );
}
