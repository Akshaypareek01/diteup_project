import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { AdminInventoryLedgerPanel } from "@/components/admin/AdminInventoryLedgerPanel";
import { AdminXlsxUploadForm } from "@/components/admin/AdminXlsxUploadForm";
import { InventoryAdjustCell } from "@/components/admin/InventoryAdjustCell";
import { adminGet } from "@/lib/admin-json";

type InvRow = {
  id: string;
  sku: string;
  variantName: string;
  productName: string;
  stockOnHand: number;
  stockReserved: number;
  lowStockThreshold: number;
};

/**
 * Inventory grid — adjust, import, export, and per-SKU ledger history.
 */
export default async function AdminInventoryPage() {
  const { data, ok } = await adminGet<{ rows: InvRow[] }>("/v1/admin/inventory?page=1&pageSize=60");

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="font-display text-display-md font-semibold text-forest">Inventory</h1>
          <p className="mt-1 text-body text-ink-soft">Adjust stock, import bulk updates, export snapshot.</p>
        </div>
        <a
          href="/v1/admin/inventory/export"
          className="inline-flex h-11 items-center justify-center rounded-lg border border-forest bg-transparent px-5 font-sans text-button font-semibold uppercase tracking-wide text-forest transition hover:bg-paper"
          target="_blank"
          rel="noreferrer"
        >
          Export snapshot
        </a>
      </div>

      <Card>
        <h2 className="font-semibold text-forest">Bulk import</h2>
        <p className="mt-1 text-body-sm text-ink-muted">XLSX columns: sku, delta (optional note)</p>
        <div className="mt-4">
          <AdminXlsxUploadForm uploadPath="/v1/admin/inventory/import" label="Import stock adjustments" />
        </div>
      </Card>

      {!ok ? (
        <p className="text-error">Could not load inventory.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-line bg-paper">
          <table className="min-w-full text-left text-body-sm">
            <thead className="bg-beige/80 font-mono text-eyebrow text-ink-muted">
              <tr>
                <th className="px-4 py-3">SKU</th>
                <th className="px-4 py-3">Product</th>
                <th className="px-4 py-3">On hand</th>
                <th className="px-4 py-3">Reserved</th>
                <th className="px-4 py-3">Low stock ≤</th>
                <th className="px-4 py-3 min-w-[280px]">Adjust</th>
                <th className="px-4 py-3">History</th>
              </tr>
            </thead>
            <tbody>
              {(data?.rows ?? []).map((r) => (
                <tr key={r.id} className="border-t border-line">
                  <td className="px-4 py-3 font-mono">{r.sku}</td>
                  <td className="px-4 py-3">
                    <span className="font-medium text-forest">{r.productName}</span>
                    <p className="text-xs text-ink-muted">{r.variantName}</p>
                  </td>
                  <td className="px-4 py-3">{r.stockOnHand}</td>
                  <td className="px-4 py-3">{r.stockReserved}</td>
                  <td className="px-4 py-3">{r.lowStockThreshold}</td>
                  <td className="px-4 py-3 align-top">
                    <InventoryAdjustCell inventoryId={r.id} />
                  </td>
                  <td className="px-4 py-3 align-top">
                    <AdminInventoryLedgerPanel inventoryId={r.id} sku={r.sku} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="text-body-sm text-ink-muted">
        <Link href="/admin/orders" className="text-gold-deep underline">
          Orders
        </Link>{" "}
        ·{" "}
        <Link href="/admin/products" className="text-gold-deep underline">
          Products
        </Link>
      </p>
    </div>
  );
}
