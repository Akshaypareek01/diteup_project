import { Suspense } from "react";
import { notFound } from "next/navigation";
import { ProductEditorClient } from "@/components/admin/ProductEditorClient";
import { serverApiFetch } from "@/lib/server-api";

type Props = { params: { productId: string } };

export default async function AdminProductEditorPage({ params }: Props) {
  const res = await serverApiFetch(`/v1/admin/products/${encodeURIComponent(params.productId)}`);
  if (res.status === 404) notFound();
  if (!res.ok) {
    return <p className="text-error">Could not load product ({res.status}).</p>;
  }
  const raw = (await res.json()) as Record<string, unknown>;
  const initial = JSON.parse(JSON.stringify(raw)) as Record<string, unknown>;

  return (
    <Suspense fallback={<p className="text-body-sm text-ink-muted">Loading editor…</p>}>
      <ProductEditorClient
        key={String(initial.updatedAt ?? initial.id ?? params.productId)}
        productId={params.productId}
        initialProduct={initial}
      />
    </Suspense>
  );
}
