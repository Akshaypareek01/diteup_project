"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { FlowHeader } from "@/components/layout/FlowHeader";
import { ApiError, clientApiJson } from "@/lib/client-api";
import { formatInr } from "@/lib/format-money";
import { pixelPurchase } from "@/lib/meta-pixel-events";

export type OrderDetailInitial = {
  order: {
    id: string;
    orderNumber: string;
    status: string;
    paymentMethod: string;
    total: number;
    shippingAddress: unknown;
    placedAt: string;
    shippedAt?: string | null;
    deliveredAt?: string | null;
  };
  items: Array<{
    productId: string;
    variantId?: string;
    productName: string;
    variantName: string;
    quantity: number;
    lineTotal: number;
  }>;
  timeline: Array<{ type: string; at: string; payload?: unknown }>;
};

type OrderTrackingShellProps = {
  orderNumber: string;
  guestToken?: string;
  initial: OrderDetailInitial;
};

/**
 * Polls `GET /v1/orders/:orderNumber`, fires Pixel Purchase once when confirmed, supports customer cancel when allowed.
 */
export function OrderTrackingShell({ orderNumber, guestToken, initial }: OrderTrackingShellProps) {
  const router = useRouter();
  const [data, setData] = useState(initial);
  const [pollErr, setPollErr] = useState<string | null>(null);
  const [busyCancel, setBusyCancel] = useState(false);
  const [cancelMsg, setCancelMsg] = useState<string | null>(null);
  const purchaseFired = useRef(false);

  const tokenQ = guestToken ? `?token=${encodeURIComponent(guestToken)}` : "";
  const fetchOrder = useCallback(async () => {
    try {
      const next = await clientApiJson<OrderDetailInitial>(`/v1/orders/${encodeURIComponent(orderNumber)}${tokenQ}`);
      setData(next);
      setPollErr(null);
    } catch (e) {
      setPollErr(e instanceof ApiError ? e.message : "Refresh failed");
    }
  }, [orderNumber, tokenQ]);

  useEffect(() => {
    const t = window.setInterval(() => {
      void fetchOrder();
    }, 30_000);
    return () => window.clearInterval(t);
  }, [fetchOrder]);

  useEffect(() => {
    if (purchaseFired.current || data.order.status !== "CONFIRMED") return;
    purchaseFired.current = true;
    const ids = data.items.map((it) => it.variantId ?? it.productId).filter(Boolean);
    pixelPurchase({
      content_ids: ids.length ? ids : [data.order.orderNumber],
      value: data.order.total,
      currency: "INR",
      transaction_id: data.order.orderNumber,
    });
  }, [data]);

  const guestView = Boolean(guestToken);
  const canLeaveReviews = data.order.status === "DELIVERED" && !guestView;

  const placedMs = new Date(data.order.placedAt).getTime();
  const withinCancelWindow = Date.now() - placedMs <= 60 * 60 * 1000;
  const canCancelOnline =
    data.order.paymentMethod === "RAZORPAY" &&
    data.order.status === "PLACED" &&
    withinCancelWindow;

  async function cancelOrder() {
    if (!canCancelOnline) return;
    const reason = window.prompt("Optional cancellation reason:") ?? "";
    setCancelMsg(null);
    setBusyCancel(true);
    try {
      await clientApiJson(`/v1/orders/${encodeURIComponent(orderNumber)}/cancel`, {
        method: "POST",
        json: {
          reason: reason.trim() || undefined,
          guestToken: guestToken ?? undefined,
        },
      });
      await fetchOrder();
      router.refresh();
    } catch (e) {
      setCancelMsg(e instanceof ApiError ? e.message : "Could not cancel.");
    } finally {
      setBusyCancel(false);
    }
  }

  const { order, items, timeline } = data;

  return (
    <div className="min-h-screen bg-cream pb-16">
      <FlowHeader backHref="/" showSearch />
      <div className="mx-auto max-w-lg px-4 py-6">
        <h1 className="font-mono text-sm font-medium text-ink-muted">Order</h1>
        <p className="font-display text-display-md font-semibold text-forest">#{order.orderNumber}</p>
        {guestView ? (
          <p className="mt-2 text-body-sm text-ink-muted">Guest tracking link (token in URL).</p>
        ) : null}

        {pollErr ? (
          <p className="mt-2 text-body-sm text-warning" role="status">
            {pollErr}
          </p>
        ) : null}

        <div className="mt-6 rounded-xl border border-line bg-paper p-5 shadow-sm">
          <p className="font-semibold text-forest">{order.status.replace(/_/g, " ")}</p>
          <p className="text-body-sm text-ink-muted">
            {order.paymentMethod} · Total {formatInr(order.total)}
          </p>
          {canCancelOnline ? (
            <div className="mt-4">
              <button
                type="button"
                className="rounded-lg border border-error/40 bg-error/10 px-4 py-2 text-body-sm font-semibold text-error"
                disabled={busyCancel}
                onClick={() => void cancelOrder()}
              >
                {busyCancel ? "Cancelling…" : "Cancel order (unpaid, 1h window)"}
              </button>
              {cancelMsg ? (
                <p className="mt-2 text-body-sm text-error" role="alert">
                  {cancelMsg}
                </p>
              ) : null}
            </div>
          ) : null}
        </div>

        <h2 className="mt-10 font-mono text-eyebrow text-ink-muted">Items</h2>
        <ul className="mt-4 space-y-3">
          {items.map((it) => (
            <li key={`${it.productId}-${it.variantName}`} className="rounded-lg border border-line bg-paper p-3 text-body-sm">
              <span className="font-medium text-forest">{it.productName}</span>
              <span className="text-ink-muted"> — {it.variantName}</span>
              <p className="mt-1">
                Qty {it.quantity} · {formatInr(it.lineTotal)}
              </p>
              {canLeaveReviews ? (
                <Link
                  href={`/account/reviews/new?orderId=${encodeURIComponent(order.id)}&productId=${encodeURIComponent(it.productId)}&productName=${encodeURIComponent(it.productName)}`}
                  className="mt-2 inline-block text-body-sm font-semibold text-gold-deep underline"
                >
                  Write review
                </Link>
              ) : null}
            </li>
          ))}
        </ul>

        <h2 className="mt-10 font-mono text-eyebrow text-ink-muted">Timeline</h2>
        {timeline.length === 0 ? (
          <p className="mt-2 text-body-sm text-ink-muted">No events yet.</p>
        ) : (
          <ol className="mt-4 space-y-4 border-l border-line pl-6">
            {timeline.map((step, i) => (
              <li key={`${step.type}-${step.at}-${i}`} className="relative">
                <span className="absolute -left-[9px] top-1.5 size-3 rounded-full border-2 border-gold bg-gold" />
                <p className="font-semibold text-forest">{step.type.replace(/_/g, " ")}</p>
                <p className="text-body-sm text-ink-muted">{new Date(step.at).toLocaleString()}</p>
              </li>
            ))}
          </ol>
        )}

        <section className="mt-10 rounded-lg border border-line bg-paper p-4">
          <h2 className="font-semibold text-forest">Delivery details</h2>
          <pre className="mt-2 whitespace-pre-wrap font-sans text-body-sm text-ink-muted">
            {typeof order.shippingAddress === "object" && order.shippingAddress
              ? JSON.stringify(order.shippingAddress, null, 2)
              : "—"}
          </pre>
        </section>

        <Link href="/" className="mt-8 block text-center text-body-sm text-gold-deep underline">
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
