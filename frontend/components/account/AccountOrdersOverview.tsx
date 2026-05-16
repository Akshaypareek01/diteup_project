import Link from "next/link";
import { shippingSnapshotLines } from "@/lib/format-order-address";
import { formatInr } from "@/lib/format-money";

/** Row from `GET /v1/me/orders`. */
export type AccountOrderSummary = {
  id: string;
  orderNumber: string;
  status: string;
  paymentMethod: string;
  subtotal: number;
  discountAmount: number;
  shippingAmount: number;
  codCharge: number;
  taxAmount: number;
  total: number;
  currency: string;
  couponCode: string | null;
  shippingAddress: unknown;
  placedAt: string;
  confirmedAt: string | null;
  items: Array<{
    productName: string;
    variantName: string;
    quantity: number;
    lineTotal: number;
  }>;
};

export type AccountOrdersOverviewProps = {
  orders: AccountOrderSummary[];
};

function paymentLabel(method: string): string {
  if (method === "RAZORPAY") return "Paid online";
  if (method === "COD") return "Cash on delivery";
  return method;
}

/**
 * Paginated buyer order history: lines, shipment snapshot, and price breakdown per order.
 */
export function AccountOrdersOverview({ orders }: AccountOrdersOverviewProps) {
  if (orders.length === 0) {
    return (
      <>
        <h1 className="font-display text-display-md font-semibold text-forest">Orders</h1>
        <p className="mt-6 text-body text-ink-soft">No orders yet.</p>
      </>
    );
  }

  return (
    <>
      <h1 className="font-display text-display-md font-semibold text-forest">Orders</h1>
      <p className="mt-2 max-w-xl text-body-sm text-ink-muted">
        Each row shows items, totals, payment method, and the ship-to address captured at checkout. Full tracking stays on the
        detail page.
      </p>

      <ul className="mt-8 space-y-6">
        {orders.map((o) => {
          const addrLines = shippingSnapshotLines(o.shippingAddress);

          return (
            <li
              key={o.id}
              className="overflow-hidden rounded-xl border border-line bg-paper shadow-sm"
              aria-labelledby={`order-title-${o.id}`}
            >
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-line bg-parchment/40 px-4 py-4 sm:px-5">
                <div>
                  <h2 id={`order-title-${o.id}`} className="text-base leading-tight">
                    <Link
                      href={`/order/${encodeURIComponent(o.orderNumber)}`}
                      className="font-mono font-bold text-gold-deep underline underline-offset-2 hover:text-forest"
                    >
                      {o.orderNumber}
                    </Link>
                  </h2>
                  <p className="mt-1 text-body-sm text-ink-muted">{new Date(o.placedAt).toLocaleString()}</p>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="rounded-full bg-beige px-3 py-1 text-body-sm font-semibold text-forest">{o.status}</span>
                  <span className="text-body-sm text-ink-muted">{paymentLabel(o.paymentMethod)}</span>
                </div>
              </div>

              <div className="grid gap-6 px-4 py-5 sm:grid-cols-2 sm:px-5">
                <div>
                  <h3 className="font-mono text-eyebrow font-semibold uppercase text-ink-muted">Items</h3>
                  <ul className="mt-2 space-y-2 text-body-sm text-forest">
                    {o.items.map((it, idx) => (
                      <li key={`${o.id}-${idx}`} className="flex justify-between gap-4 border-b border-line/70 pb-2 last:border-0">
                        <span>
                          <span className="font-medium">{it.productName}</span>
                          {it.variantName ? (
                            <span className="block text-body-sm text-ink-muted">{it.variantName}</span>
                          ) : null}
                          <span className="sr-only">Quantity </span>
                          <span className="block text-body-sm text-ink-muted">Qty {it.quantity}</span>
                        </span>
                        <span className="shrink-0 font-mono">{formatInr(it.lineTotal)}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="space-y-4">
                  <div>
                    <h3 className="font-mono text-eyebrow font-semibold uppercase text-ink-muted">Ship to</h3>
                    {addrLines.length > 0 ? (
                      <address className="mt-2 space-y-0.5 not-italic text-body-sm leading-relaxed text-forest">
                        {addrLines.map((ln, i) => (
                          <div key={`${o.id}-addr-${i}`}>{ln}</div>
                        ))}
                      </address>
                    ) : (
                      <p className="mt-2 text-body-sm text-ink-muted">Address on file · open order for details.</p>
                    )}
                  </div>

                  <div>
                    <h3 className="font-mono text-eyebrow font-semibold uppercase text-ink-muted">Totals ({o.currency})</h3>
                    <dl className="mt-2 space-y-1 text-body-sm text-forest">
                      <div className="flex justify-between gap-4">
                        <dt>Subtotal</dt>
                        <dd className="font-mono">{formatInr(o.subtotal)}</dd>
                      </div>
                      {o.discountAmount > 0 ? (
                        <div className="flex justify-between gap-4">
                          <dt>Discount</dt>
                          <dd className="font-mono text-success">−{formatInr(o.discountAmount)}</dd>
                        </div>
                      ) : null}
                      <div className="flex justify-between gap-4">
                        <dt>Shipping</dt>
                        <dd className="font-mono">{formatInr(o.shippingAmount)}</dd>
                      </div>
                      {o.codCharge > 0 ? (
                        <div className="flex justify-between gap-4">
                          <dt>COD fee</dt>
                          <dd className="font-mono">{formatInr(o.codCharge)}</dd>
                        </div>
                      ) : null}
                      {o.taxAmount > 0 ? (
                        <div className="flex justify-between gap-4">
                          <dt>Tax / GST</dt>
                          <dd className="font-mono">{formatInr(o.taxAmount)}</dd>
                        </div>
                      ) : null}
                      <div className="flex justify-between gap-4 border-t border-line pt-2 font-semibold">
                        <dt>Total paid / due</dt>
                        <dd className="font-mono">{formatInr(o.total)}</dd>
                      </div>
                    </dl>
                    {o.couponCode ? (
                      <p className="mt-2 text-body-sm text-ink-muted">
                        Coupon: <span className="font-mono font-medium text-forest">{o.couponCode}</span>
                      </p>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-3 border-t border-line bg-parchment/25 px-4 py-4 sm:px-5">
                <Link href={`/order/${encodeURIComponent(o.orderNumber)}`} className="text-body-sm font-semibold text-gold-deep underline">
                  Track &amp; full details →
                </Link>
              </div>
            </li>
          );
        })}
      </ul>
    </>
  );
}
