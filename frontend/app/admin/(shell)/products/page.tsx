import Link from "next/link";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { formatInr, moneyNumber } from "@/lib/format-money";
import { adminGet } from "@/lib/admin-json";

type ProductRow = {
  id: string;
  name: string;
  slug: string;
  visibility: string;
  updatedAt: string;
  variants: Array<{
    priceSale?: unknown;
    inventory?: { stockOnHand: number; stockReserved: number } | null;
  }>;
};

/**
 * Product catalog list — `GET /v1/admin/products`.
 */
export default async function AdminProductsPage() {
  const { data, ok } = await adminGet<{ products: ProductRow[] }>("/v1/admin/products?page=1&pageSize=80");
  const products = data?.products ?? [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-display text-display-md font-semibold text-forest">Products</h1>
          <p className="mt-1 text-body text-ink-soft">From `GET /v1/admin/products`.</p>
        </div>
        <Button variant="primaryGold" size="md" type="button" href="/admin/products/new">
          New product
        </Button>
      </div>
      {!ok ? (
        <p className="text-error">Could not load products.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-line bg-paper">
          <table className="min-w-full text-left text-body-sm">
            <thead className="bg-beige/80 font-mono text-eyebrow text-ink-muted">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Visibility</th>
                <th className="px-4 py-3">Stock (est.)</th>
                <th className="px-4 py-3">From price</th>
                <th className="px-4 py-3">Updated</th>
              </tr>
            </thead>
            <tbody>
              {products.length === 0 ? (
                <tr>
                  <td colSpan={5} className="px-4 py-8 text-center text-ink-muted">
                    No products.
                  </td>
                </tr>
              ) : (
                products.map((p) => {
                  const first = p.variants[0];
                  const price = first ? moneyNumber(first.priceSale) : 0;
                  const stock = p.variants.reduce((acc, v) => {
                    const inv = v.inventory;
                    if (!inv) return acc;
                    return acc + Math.max(0, inv.stockOnHand - inv.stockReserved);
                  }, 0);
                  return (
                    <tr key={p.id} className="border-t border-line">
                      <td className="px-4 py-3">
                        <Link href={`/admin/products/${encodeURIComponent(p.id)}`} className="font-semibold text-gold-deep hover:underline">
                          {p.name}
                        </Link>
                        <p className="font-mono text-xs text-ink-muted">{p.slug}</p>
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant="outline">{p.visibility}</Badge>
                      </td>
                      <td className="px-4 py-3">{stock}</td>
                      <td className="px-4 py-3">{formatInr(price)}</td>
                      <td className="px-4 py-3 text-ink-muted">{new Date(p.updatedAt).toLocaleString()}</td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
