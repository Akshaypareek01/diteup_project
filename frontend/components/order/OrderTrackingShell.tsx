"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type SVGProps } from "react";
import { FlowHeader } from "@/components/layout/FlowHeader";
import { ApiError, clientApiJson } from "@/lib/client-api";
import { shippingSnapshotLines } from "@/lib/format-order-address";
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
 * Short supporting sentence for the prominent status card from raw order status.
 */
function orderStatusSubtitle(status: string): string {
  const u = status.toUpperCase();
  if (u === "DELIVERED") return "Your order has been delivered.";
  if (u === "PLACED") return "We’ve received your order.";
  if (u === "CONFIRMED") return "Payment confirmed — we’ll pack it soon.";
  if (u === "SHIPPED" || u.includes("TRANSIT")) return "Your order is on the way!";
  if (u === "CANCELLED") return "This order was cancelled.";
  return "We’ll keep this page updated as your order moves.";
}

/**
 * Left chevron for inline back link (matches `FlowHeader` stroke weight).
 */
function OrderBackChevron(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.85}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <path d="M15 5.5 8.5 12 15 18.5" />
    </svg>
  );
}

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
  const primaryLabel = items[0]?.productName ?? "Your order";
  const shipLines = shippingSnapshotLines(order.shippingAddress);

  return (
    <div className="min-h-screen bg-cream pb-12">
      <FlowHeader backHref="/" showSearch />
      <main className="mx-auto max-w-lg px-4 pb-10 pt-5">
        <div className="flex items-start gap-3">
          <Link
            href="/"
            className="mt-1 inline-flex size-10 shrink-0 items-center justify-center rounded-full border border-line bg-paper text-forest shadow-sm transition hover:border-forest/25 hover:bg-beige/40 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
            aria-label="Back to home"
          >
            <OrderBackChevron className="size-5" />
          </Link>
          <div className="min-w-0 flex-1">
            <p className="font-mono text-eyebrow tracking-[0.16em] text-ink-muted">ORDER</p>
            <h1 className="font-display text-balance text-display-md font-semibold uppercase tracking-tight text-forest">
              #{order.orderNumber}
            </h1>
          </div>
        </div>

        {guestView ? (
          <p className="mt-3 text-body-sm text-ink-muted">Guest tracking link (token in URL).</p>
        ) : null}

        {pollErr ? (
          <p className="mt-3 text-body-sm text-warning" role="status">
            {pollErr}
          </p>
        ) : null}

        <section aria-labelledby="order-product-heading" className="mt-6">
          <h2 id="order-product-heading" className="sr-only">
            Product in this order
          </h2>
          <div className="overflow-hidden rounded-2xl border border-line bg-paper shadow-[0_12px_40px_-18px_rgba(31,61,46,0.45)] ring-1 ring-forest/5">
            <div className="bg-gradient-to-b from-beige/50 to-paper px-4 pb-5 pt-6 sm:px-6">
              <Image
                src="/assets/Images/prodcut_clean.png"
                alt={`${primaryLabel} — DiteUp packaging`}
                width={640}
                height={640}
                priority
                sizes="(max-width: 512px) 100vw, 512px"
                className="mx-auto h-auto max-h-[min(58vw,280px)] w-full object-contain drop-shadow-md"
              />
            </div>
          </div>
          <p className="mt-3 text-center text-body-sm text-ink-muted">{primaryLabel}</p>
        </section>

        <section
          className="mt-6 rounded-2xl border border-success/30 bg-gradient-to-br from-success/12 via-paper to-paper p-5 shadow-sm"
          aria-labelledby="order-status-heading"
        >
          <div className="flex gap-4">
            <div
              className="flex size-12 shrink-0 items-center justify-center rounded-full bg-success/20 text-success"
              aria-hidden
            >
              <svg viewBox="0 0 24 24" className="size-6" fill="none" stroke="currentColor" strokeWidth="1.75">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20 7h-3V5a1 1 0 0 0-1-1H8a1 1 0 0 0-1 1v2H4" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 9h16v10a1 1 0 0 1-1 1H5a1 1 0 0 1-1-1V9z" />
                <path strokeLinecap="round" d="M9 13h6" />
              </svg>
            </div>
            <div className="min-w-0">
              <h2 id="order-status-heading" className="text-lg font-semibold capitalize text-forest sm:text-xl">
                {order.status.replace(/_/g, " ").toLowerCase()}
              </h2>
              <p className="mt-1 text-body-sm leading-relaxed text-ink-soft">{orderStatusSubtitle(order.status)}</p>
              <p className="mt-3 font-mono text-body-sm text-ink-muted">
                {order.paymentMethod} · Total {formatInr(order.total)}
              </p>
            </div>
          </div>

          {canCancelOnline ? (
            <div className="mt-4 border-t border-line/70 pt-4">
              <button
                type="button"
                className="w-full rounded-xl border border-error/40 bg-error/10 px-4 py-3 text-body-sm font-semibold text-error transition hover:bg-error/15 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error"
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
        </section>

        <h2 className="mt-12 font-mono text-eyebrow tracking-[0.12em] text-ink-muted">Items</h2>
        <ul className="mt-4 space-y-3">
          {items.map((it) => (
            <li
              key={`${it.productId}-${it.variantName}`}
              className="rounded-xl border border-line bg-paper/90 p-4 text-body-sm shadow-[0_1px_0_rgba(31,61,46,0.04)] backdrop-blur-sm"
            >
              <span className="font-semibold text-forest">{it.productName}</span>
              <span className="text-ink-muted"> — {it.variantName}</span>
              <p className="mt-1.5 text-ink-soft">
                Qty {it.quantity} · {formatInr(it.lineTotal)}
              </p>
              {canLeaveReviews ? (
                <Link
                  href={`/account/reviews/new?orderId=${encodeURIComponent(order.id)}&productId=${encodeURIComponent(it.productId)}&productName=${encodeURIComponent(it.productName)}`}
                  className="mt-3 inline-block text-body-sm font-semibold text-gold-deep underline decoration-gold-deep/40 underline-offset-4 hover:text-forest hover:decoration-forest"
                >
                  Write review
                </Link>
              ) : null}
            </li>
          ))}
        </ul>

        <h2 className="mt-12 font-mono text-eyebrow tracking-[0.12em] text-ink-muted">Timeline</h2>
        {timeline.length === 0 ? (
          <p className="mt-3 text-body-sm text-ink-muted">No events yet.</p>
        ) : (
          <ol className="relative mt-6 space-y-6 border-l-2 border-line pl-8">
            {timeline.map((step, i) => {
              const isLatest = i === timeline.length - 1;
              return (
                <li key={`${step.type}-${step.at}-${i}`} className="relative">
                  <span
                    className={[
                      "absolute -left-[23px] top-1.5 inline-flex size-4 rounded-full border-2 shadow-sm transition",
                      isLatest
                        ? "border-success bg-success ring-4 ring-success/20"
                        : "border-gold-deep/60 bg-gold/90",
                    ].join(" ")}
                    aria-hidden
                  />
                  <p className={`font-semibold capitalize text-forest ${isLatest ? "text-balance" : ""}`}>
                    {step.type.replace(/_/g, " ").toLowerCase()}
                  </p>
                  <p className="mt-1 text-body-sm text-ink-muted">{new Date(step.at).toLocaleString()}</p>
                </li>
              );
            })}
          </ol>
        )}

        <section
          className="mt-12 rounded-2xl border border-line bg-paper px-5 py-5 shadow-sm"
          aria-labelledby="delivery-heading"
        >
          <h2 id="delivery-heading" className="font-mono text-eyebrow tracking-[0.14em] text-ink-muted">
            Delivery details
          </h2>
          {shipLines.length === 0 ? (
            <p className="mt-3 text-body-sm text-ink-muted">Shipping address unavailable.</p>
          ) : (
            <address className="mt-4 not-italic">
              <ul className="space-y-2 text-body-sm leading-relaxed text-ink-soft">
                {shipLines.map((line) => (
                  <li key={line}>{line}</li>
                ))}
              </ul>
            </address>
          )}
        </section>

        <div
          className="mt-12 grid grid-cols-3 gap-3 border-t border-line pt-8 text-center text-body-sm text-ink-soft"
          role="list"
        >
          <div role="listitem" className="space-y-1.5 px-1">
            <svg
              viewBox="0 0 24 24"
              className="mx-auto size-7 text-olive"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              aria-hidden
            >
              <path d="M4 17h13l3-11H8" strokeLinecap="round" strokeLinejoin="round" />
              <circle cx="8.5" cy="19.5" r="1.5" />
              <circle cx="17.5" cy="19.5" r="1.5" />
              <path d="M16 11V6l-5-3" strokeLinecap="round" />
            </svg>
            <p className="font-semibold leading-tight text-forest">Fast delivery</p>
            <p className="text-body-sm text-ink-muted">Across India</p>
          </div>
          <div role="listitem" className="space-y-1.5 px-1">
            <svg
              viewBox="0 0 24 24"
              className="mx-auto size-7 text-olive"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              aria-hidden
            >
              <path d="M12 3 4 9v11h16V9l-8-6Z" strokeLinecap="round" strokeLinejoin="round" />
              <path d="m9 15 2 2 4-5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="font-semibold leading-tight text-forest">Safe packaging</p>
            <p className="text-body-sm text-ink-muted">Tamper-conscious</p>
          </div>
          <div role="listitem" className="space-y-1.5 px-1">
            <svg
              viewBox="0 0 24 24"
              className="mx-auto size-7 text-olive"
              fill="none"
              stroke="currentColor"
              strokeWidth="1.6"
              aria-hidden
            >
              <path d="M4 14v7h16v-7" strokeLinecap="round" strokeLinejoin="round" />
              <path d="m8 17 8-8 3 3" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M15 11h3v3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <p className="font-semibold leading-tight text-forest">Easy returns</p>
            <p className="text-body-sm text-ink-muted">No hassle</p>
          </div>
        </div>

        <Link
          href="/"
          className="mt-10 flex min-h-[48px] w-full items-center justify-center rounded-xl bg-forest px-4 py-3.5 text-center font-sans text-[15px] font-semibold uppercase tracking-[0.12em] leading-none text-cream shadow-[0_8px_24px_-12px_rgba(31,61,46,0.65)] transition hover:bg-sage hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
        >
          Continue shopping
        </Link>
      </main>
    </div>
  );
}
