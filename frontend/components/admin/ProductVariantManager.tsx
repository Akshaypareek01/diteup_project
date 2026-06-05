"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Badge } from "@/components/ui/Badge";
import { ApiError, clientApiJson } from "@/lib/client-api";

type VariantRecord = Record<string, unknown>;

export type ProductVariantManagerProps = {
  productId: string;
  variants: VariantRecord[];
};

function str(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  if (typeof v === "object" && v !== null && "toString" in v) return String(v);
  return String(v);
}

function inventoryStock(v: VariantRecord): string {
  const inv = v.inventory;
  if (!inv || typeof inv !== "object") return "—";
  return str((inv as Record<string, unknown>).stockOnHand);
}

type VariantEditFormProps = {
  productId: string;
  variant: VariantRecord;
  onDone: () => void;
  onCancel: () => void;
};

/**
 * Inline editor for a single variant — PATCH via `POST /v1/admin/products/:id/variants` with `variantId`.
 */
function VariantEditForm({ productId, variant, onDone, onCancel }: VariantEditFormProps) {
  const router = useRouter();
  const [sku, setSku] = useState(str(variant.sku));
  const [name, setName] = useState(str(variant.name));
  const [priceMrp, setPriceMrp] = useState(str(variant.priceMrp));
  const [priceSale, setPriceSale] = useState(str(variant.priceSale));
  const [weightGm, setWeightGm] = useState(str(variant.weightGm));
  const [isDefault, setIsDefault] = useState(Boolean(variant.isDefault));
  const [isActive, setIsActive] = useState(variant.isActive !== false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function save() {
    setMsg(null);
    setBusy(true);
    try {
      await clientApiJson(`/v1/admin/products/${encodeURIComponent(productId)}/variants`, {
        method: "POST",
        json: {
          variantId: str(variant.id),
          sku: sku.trim(),
          name: name.trim(),
          priceMrp: Number(priceMrp),
          priceSale: Number(priceSale),
          weightGm: weightGm.trim() === "" ? null : Number(weightGm),
          isDefault,
          isActive,
        },
      });
      router.refresh();
      onDone();
    } catch (e) {
      setMsg(e instanceof ApiError ? e.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mt-3 rounded-lg border border-line bg-cream/60 p-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <Input label="SKU" value={sku} onChange={(e) => setSku(e.target.value)} />
        <Input label="Variant name" value={name} onChange={(e) => setName(e.target.value)} />
        <Input label="MRP (₹)" value={priceMrp} onChange={(e) => setPriceMrp(e.target.value)} />
        <Input label="Sale price (₹)" value={priceSale} onChange={(e) => setPriceSale(e.target.value)} />
        <Input label="Weight (g)" value={weightGm} onChange={(e) => setWeightGm(e.target.value)} />
      </div>
      <div className="mt-3 flex flex-wrap gap-4 text-body-sm">
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={isDefault} onChange={(e) => setIsDefault(e.target.checked)} />
          Default variant
        </label>
        <label className="flex items-center gap-2">
          <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
          Active on storefront
        </label>
      </div>
      {msg ? (
        <p className="mt-2 text-body-sm text-error" role="alert">
          {msg}
        </p>
      ) : null}
      <div className="mt-4 flex flex-wrap gap-2">
        <Button type="button" variant="primaryForest" size="sm" disabled={busy} onClick={() => void save()}>
          {busy ? "Saving…" : "Save variant"}
        </Button>
        <Button type="button" variant="secondary" size="sm" disabled={busy} onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  );
}

type VariantRowProps = {
  productId: string;
  variant: VariantRecord;
  canRemove: boolean;
};

/**
 * Read-only variant summary with edit / deactivate actions.
 */
function VariantRow({ productId, variant, canRemove }: VariantRowProps) {
  const router = useRouter();
  const [editing, setEditing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const isActive = variant.isActive !== false;

  async function setActive(nextActive: boolean) {
    const label = nextActive ? "restore" : "deactivate";
    const confirmMsg = nextActive
      ? "Show this variant on the storefront again?"
      : "Deactivate this variant? It will be hidden from the storefront.";
    if (!window.confirm(confirmMsg)) return;

    setErr(null);
    setBusy(true);
    try {
      await clientApiJson(`/v1/admin/products/${encodeURIComponent(productId)}/variants`, {
        method: "POST",
        json: {
          variantId: str(variant.id),
          sku: str(variant.sku),
          name: str(variant.name),
          priceMrp: Number(variant.priceMrp),
          priceSale: Number(variant.priceSale),
          weightGm: variant.weightGm == null ? null : Number(variant.weightGm),
          isDefault: Boolean(variant.isDefault),
          isActive: nextActive,
        },
      });
      router.refresh();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : `Could not ${label} variant.`);
    } finally {
      setBusy(false);
    }
  }

  return (
    <li className="rounded-lg border border-line bg-white px-4 py-3 shadow-xs">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 flex-1 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-semibold text-forest">{str(variant.name)}</p>
            {Boolean(variant.isDefault) ? <Badge variant="outline">Default</Badge> : null}
            {!isActive ? <Badge variant="warning">Inactive</Badge> : null}
          </div>
          <p className="font-mono text-body-sm text-ink-muted">SKU: {str(variant.sku)}</p>
          <p className="text-body-sm text-ink-soft">
            MRP {str(variant.priceMrp)} · Sale {str(variant.priceSale)} · Stock {inventoryStock(variant)}
          </p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button
            type="button"
            variant="secondary"
            size="sm"
            disabled={busy}
            onClick={() => setEditing((v) => !v)}
          >
            {editing ? "Close" : "Edit"}
          </Button>
          {isActive ? (
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={busy || !canRemove}
              title={canRemove ? undefined : "Keep at least one active variant"}
              onClick={() => void setActive(false)}
            >
              Deactivate
            </Button>
          ) : (
            <Button type="button" variant="secondary" size="sm" disabled={busy} onClick={() => void setActive(true)}>
              Restore
            </Button>
          )}
        </div>
      </div>
      {err ? (
        <p className="mt-2 text-body-sm text-error" role="alert">
          {err}
        </p>
      ) : null}
      {editing ? (
        <VariantEditForm productId={productId} variant={variant} onDone={() => setEditing(false)} onCancel={() => setEditing(false)} />
      ) : null}
    </li>
  );
}

/**
 * Lists existing variants with edit/deactivate controls plus add-variant form.
 */
export function ProductVariantManager({ productId, variants }: ProductVariantManagerProps) {
  const router = useRouter();
  const [sku, setSku] = useState("");
  const [variantName, setVariantName] = useState("");
  const [priceMrp, setPriceMrp] = useState("");
  const [priceSale, setPriceSale] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const activeCount = variants.filter((v) => v.isActive !== false).length;

  async function add() {
    setMsg(null);
    setBusy(true);
    try {
      await clientApiJson(`/v1/admin/products/${encodeURIComponent(productId)}/variants`, {
        method: "POST",
        json: {
          sku: sku.trim(),
          name: variantName.trim(),
          priceMrp: Number(priceMrp),
          priceSale: Number(priceSale),
          isDefault: variants.length === 0,
          isActive: true,
        },
      });
      setSku("");
      setVariantName("");
      setPriceMrp("");
      setPriceSale("");
      router.refresh();
    } catch (e) {
      setMsg(e instanceof ApiError ? e.message : "Failed to add variant.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {variants.length === 0 ? (
        <p className="text-body-sm text-ink-muted">No variants yet — add the first one below.</p>
      ) : (
        <ul className="space-y-3" aria-label="Product variants">
          {variants.map((v) => (
            <VariantRow key={str(v.id)} productId={productId} variant={v} canRemove={activeCount > 1} />
          ))}
        </ul>
      )}

      <div className="rounded-lg border border-dashed border-line p-4">
        <h3 className="font-semibold text-forest">Add variant</h3>
        <div className="mt-4 grid gap-3 sm:grid-cols-2">
          <Input label="SKU" value={sku} onChange={(e) => setSku(e.target.value)} />
          <Input label="Variant name" value={variantName} onChange={(e) => setVariantName(e.target.value)} />
          <Input label="MRP (₹)" value={priceMrp} onChange={(e) => setPriceMrp(e.target.value)} />
          <Input label="Sale price (₹)" value={priceSale} onChange={(e) => setPriceSale(e.target.value)} />
        </div>
        {msg ? (
          <p className="mt-2 text-body-sm text-error" role="alert">
            {msg}
          </p>
        ) : null}
        <Button type="button" className="mt-3" variant="secondary" size="sm" disabled={busy} onClick={() => void add()}>
          {busy ? "Adding…" : "Add variant"}
        </Button>
      </div>
    </div>
  );
}
