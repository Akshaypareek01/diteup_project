import Link from "next/link";
import { notFound } from "next/navigation";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { formatInr } from "@/lib/format-money";
import { adminGet } from "@/lib/admin-json";

type AnalyticsResponse = {
  couponId: string;
  code: string;
  redemptionsActive: number;
  redemptionsReversed: number;
  totalDiscountGiven: number;
};

type CouponDetail = {
  id: string;
  code: string;
  type: string;
  value: number;
  description: string | null;
  isActive: boolean;
  usedCount: number;
  usageLimit: number | null;
};

type Redemption = {
  id: string;
  discountAmount: number;
  cartSubtotal: number;
  redeemedAt: string;
  isReversed: boolean;
  order: { orderNumber: string; status: string; total: unknown } | null;
};

type CouponBundle = { coupon: CouponDetail; redemptions: Redemption[] };

type Props = { params: { couponId: string } };

/**
 * Per-coupon analytics + recent redemptions — `GET /v1/admin/coupons/:id` + `/analytics`.
 */
export default async function AdminCouponAnalyticsPage({ params }: Props) {
  const { couponId } = params;
  const [bundleRes, analyticsRes] = await Promise.all([
    adminGet<CouponBundle>(`/v1/admin/coupons/${encodeURIComponent(couponId)}`),
    adminGet<AnalyticsResponse>(`/v1/admin/coupons/${encodeURIComponent(couponId)}/analytics`),
  ]);

  if (!bundleRes.ok || !bundleRes.data?.coupon) notFound();
  const { coupon, redemptions } = bundleRes.data;
  const ax = analyticsRes.data;

  const exportHref = `/v1/admin/coupons/${encodeURIComponent(couponId)}/redemptions/export`;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-display-md font-semibold text-forest">{coupon.code}</h1>
          <p className="mt-1 font-mono text-body-sm text-ink-muted">{coupon.id}</p>
        </div>
        <a
          href={exportHref}
          className="inline-flex h-11 items-center justify-center rounded-lg border border-forest bg-transparent px-4 font-sans text-button font-semibold uppercase tracking-wide text-forest"
          target="_blank"
          rel="noreferrer"
        >
          Export redemptions
        </a>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <h2 className="font-semibold text-forest">Summary</h2>
          <dl className="mt-4 space-y-2 text-body-sm">
            <div>
              <dt className="text-ink-muted">Type / value</dt>
              <dd>
                {coupon.type === "PERCENT"
                  ? `${coupon.value}% off`
                  : coupon.type === "FLAT"
                    ? formatInr(coupon.value)
                    : coupon.type}
              </dd>
            </div>
            <div>
              <dt className="text-ink-muted">Status</dt>
              <dd>
                {coupon.isActive ? <Badge variant="success">Active</Badge> : <Badge variant="warning">Inactive</Badge>}
              </dd>
            </div>
            <div>
              <dt className="text-ink-muted">Used</dt>
              <dd>
                {coupon.usedCount}
                {coupon.usageLimit != null ? ` / ${coupon.usageLimit}` : ""}
              </dd>
            </div>
            {coupon.description ? (
              <div>
                <dt className="text-ink-muted">Description</dt>
                <dd>{coupon.description}</dd>
              </div>
            ) : null}
          </dl>
        </Card>
        <Card>
          <h2 className="font-semibold text-forest">Analytics</h2>
          {analyticsRes.ok && ax ? (
            <dl className="mt-4 space-y-2 text-body-sm">
              <div>
                <dt className="text-ink-muted">Active redemptions</dt>
                <dd>{ax.redemptionsActive}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">Reversed</dt>
                <dd>{ax.redemptionsReversed}</dd>
              </div>
              <div>
                <dt className="text-ink-muted">Total discount given</dt>
                <dd>{formatInr(ax.totalDiscountGiven)}</dd>
              </div>
            </dl>
          ) : (
            <p className="mt-4 text-body-sm text-ink-muted">Analytics unavailable.</p>
          )}
        </Card>
      </div>

      <Card>
        <h2 className="font-semibold text-forest">Recent redemptions</h2>
        <div className="mt-4 overflow-x-auto">
          <table className="min-w-full text-left text-body-sm">
            <thead className="bg-beige/80 font-mono text-eyebrow text-ink-muted">
              <tr>
                <th className="px-3 py-2">When</th>
                <th className="px-3 py-2">Order</th>
                <th className="px-3 py-2">Discount</th>
                <th className="px-3 py-2">Reversed</th>
              </tr>
            </thead>
            <tbody>
              {redemptions.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-3 py-6 text-center text-ink-muted">
                    No redemptions yet.
                  </td>
                </tr>
              ) : (
                redemptions.map((r) => (
                  <tr key={r.id} className="border-t border-line">
                    <td className="px-3 py-2 text-ink-muted">{new Date(r.redeemedAt).toLocaleString()}</td>
                    <td className="px-3 py-2 font-mono">{r.order?.orderNumber ?? "—"}</td>
                    <td className="px-3 py-2">{formatInr(r.discountAmount)}</td>
                    <td className="px-3 py-2">{r.isReversed ? "Yes" : "No"}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <Link href="/admin/coupons" className="text-body-sm text-gold-deep hover:underline">
        ← Coupons
      </Link>
    </div>
  );
}
