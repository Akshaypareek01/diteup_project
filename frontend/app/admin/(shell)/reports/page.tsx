import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { adminGet } from "@/lib/admin-json";

type ExportItem = { id: string; method: string; path: string };

type HubResponse = { exports: ExportItem[] };

/**
 * Reports hub — `GET /v1/admin/reports` plus known export URLs.
 */
export default async function AdminReportsPage() {
  const { data, ok } = await adminGet<HubResponse>("/v1/admin/reports");

  const exportsList = data?.exports ?? [];

  const labels: Record<string, string> = {
    orders: "Orders — spreadsheet export (filters via query string on API)",
    payments: "Payments — XLSX (status / search filters via query string)",
    users: "Users — XLSX",
    inventory: "Inventory — snapshot XLSX",
    coupon_redemptions: "Coupon redemptions — open a coupon, then export",
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-display-md font-semibold text-forest">Reports hub</h1>
      <p className="text-body text-ink-soft">
        Download links hit the Express API with your session cookie (same-origin `/v1` rewrite).
      </p>
      {!ok ? (
        <p className="text-error">Could not load report definitions.</p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {exportsList.map((item) => {
            const isParameterized = item.path.includes(":couponId");
            const href = isParameterized ? null : item.path;
            return (
              <li key={item.id}>
                <Card>
                  <p className="font-medium text-forest">{labels[item.id] ?? item.id}</p>
                  <p className="mt-1 font-mono text-xs text-ink-muted">{item.method} {item.path}</p>
                  {href ? (
                    <a
                      href={href}
                      className="mt-3 inline-flex text-body-sm font-semibold text-gold-deep underline"
                      target="_blank"
                      rel="noreferrer"
                    >
                      Download →
                    </a>
                  ) : (
                    <Link href="/admin/coupons" className="mt-3 inline-flex text-body-sm font-semibold text-gold-deep underline">
                      Pick a coupon →
                    </Link>
                  )}
                </Card>
              </li>
            );
          })}
        </ul>
      )}
      <Card>
        <p className="text-body-sm text-ink-muted">
          Order exports support the same filter query parameters as{" "}
          <code className="font-mono text-xs">GET /v1/admin/orders/export</code> on the backend.
        </p>
      </Card>
    </div>
  );
}
