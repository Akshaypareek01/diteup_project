"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useMemo, useState } from "react";
import { productEditorTabs } from "@/lib/admin-nav";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { cn } from "@/lib/utils";
import { ApiError, clientApiJson } from "@/lib/client-api";

const VISIBILITY = [
  "DRAFT",
  "PUBLISHED",
  "HIDDEN",
  "COMING_SOON",
  "OUT_OF_STOCK",
  "UNDER_MAINTENANCE",
  "ARCHIVED",
] as const;

const BADGES = ["", "NEW", "BESTSELLER", "LIMITED", "SALE", "BACK_IN_STOCK"];

function str(v: unknown): string {
  if (v == null) return "";
  if (typeof v === "string") return v;
  if (typeof v === "number" && Number.isFinite(v)) return String(v);
  return String(v);
}

function toLocalInput(iso: unknown): string {
  if (!iso || typeof iso !== "string") return "";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  return d.toISOString().slice(0, 16);
}

export type ProductEditorClientProps = {
  productId: string;
  /** Plain JSON-serializable product from `GET /v1/admin/products/:id`. */
  initialProduct: Record<string, unknown>;
};

/**
 * Tabbed admin product editor — core fields PATCH to `/v1/admin/products/:id`, variants + media via POST.
 */
export function ProductEditorClient({ productId, initialProduct }: ProductEditorClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const tabFromUrl = searchParams.get("tab");
  const initialTab = productEditorTabs.some((t) => t.id === tabFromUrl) ? tabFromUrl! : "basics";
  const [tab, setTab] = useState(initialTab);

  const [name, setName] = useState(str(initialProduct.name));
  const [slug, setSlug] = useState(str(initialProduct.slug));
  const [description, setDescription] = useState(str(initialProduct.description));
  const [shortDesc, setShortDesc] = useState(str(initialProduct.shortDesc));
  const [visibility, setVisibility] = useState(str(initialProduct.visibility) || "DRAFT");
  const [visibilityNote, setVisibilityNote] = useState(str(initialProduct.visibilityNote));
  const [availableFrom, setAvailableFrom] = useState(toLocalInput(initialProduct.availableFrom));
  const [availableUntil, setAvailableUntil] = useState(toLocalInput(initialProduct.availableUntil));
  const [isFeatured, setIsFeatured] = useState(Boolean(initialProduct.isFeatured));
  const [displayBadge, setDisplayBadge] = useState(
    initialProduct.displayBadge == null ? "" : str(initialProduct.displayBadge),
  );
  const [codEnabled, setCodEnabled] = useState(Boolean(initialProduct.codEnabled));
  const [onlinePaymentEnabled, setOnlinePaymentEnabled] = useState(
    Boolean(initialProduct.onlinePaymentEnabled),
  );
  const [allowBackorder, setAllowBackorder] = useState(Boolean(initialProduct.allowBackorder));
  const [showStockCount, setShowStockCount] = useState(Boolean(initialProduct.showStockCount));
  const [reviewsEnabled, setReviewsEnabled] = useState(Boolean(initialProduct.reviewsEnabled));
  const [gstRate, setGstRate] = useState(str(initialProduct.gstRate));
  const [hsnCode, setHsnCode] = useState(str(initialProduct.hsnCode));
  const [isRefundable, setIsRefundable] = useState(Boolean(initialProduct.isRefundable));
  const [refundWindowDays, setRefundWindowDays] = useState(str(initialProduct.refundWindowDays));
  const [seoText, setSeoText] = useState(
    typeof initialProduct.seo === "object" && initialProduct.seo !== null
      ? JSON.stringify(initialProduct.seo, null, 2)
      : "{}",
  );

  const [err, setErr] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const variants = useMemo(() => {
    const v = initialProduct.variants;
    return Array.isArray(v) ? (v as Record<string, unknown>[]) : [];
  }, [initialProduct.variants]);

  const media = useMemo(() => {
    const m = initialProduct.media;
    return Array.isArray(m) ? (m as Record<string, unknown>[]) : [];
  }, [initialProduct.media]);

  const faqs = useMemo(() => {
    const f = initialProduct.faqs;
    return Array.isArray(f) ? f : [];
  }, [initialProduct.faqs]);

  const title = useMemo(() => productEditorTabs.find((t) => t.id === tab)?.label ?? tab, [tab]);

  const saveCore = useCallback(async () => {
    setErr(null);
    let seo: unknown = null;
    try {
      seo = JSON.parse(seoText) as unknown;
    } catch {
      setErr("SEO must be valid JSON.");
      return;
    }
    const body: Record<string, unknown> = {
      name: name.trim(),
      slug: slug.trim(),
      description: description.trim(),
      shortDesc: shortDesc.trim() || null,
      visibility,
      visibilityNote: visibilityNote.trim() || null,
      availableFrom: availableFrom ? new Date(availableFrom).toISOString() : null,
      availableUntil: availableUntil ? new Date(availableUntil).toISOString() : null,
      isFeatured,
      codEnabled,
      onlinePaymentEnabled,
      allowBackorder,
      showStockCount,
      reviewsEnabled,
      isRefundable,
      refundWindowDays: refundWindowDays.trim() === "" ? null : Number(refundWindowDays),
      hsnCode: hsnCode.trim() || null,
      gstRate: gstRate.trim() === "" ? undefined : Number(gstRate),
      seo,
    };
    if (displayBadge !== "") body.displayBadge = displayBadge;
    setSaving(true);
    try {
      await clientApiJson(`/v1/admin/products/${encodeURIComponent(productId)}`, {
        method: "PATCH",
        json: body,
      });
      router.refresh();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  }, [
    name,
    slug,
    description,
    shortDesc,
    visibility,
    visibilityNote,
    availableFrom,
    availableUntil,
    isFeatured,
    displayBadge,
    codEnabled,
    onlinePaymentEnabled,
    allowBackorder,
    showStockCount,
    reviewsEnabled,
    isRefundable,
    refundWindowDays,
    hsnCode,
    gstRate,
    seoText,
    productId,
    router,
  ]);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="font-mono text-body-sm text-ink-muted">Product · {str(initialProduct.name)}</p>
          <h1 className="font-display text-display-md font-semibold text-forest">Editor</h1>
        </div>
        <Button type="button" variant="primaryForest" size="md" disabled={saving} onClick={() => void saveCore()}>
          {saving ? "Saving…" : "Save changes"}
        </Button>
      </div>

      {err ? (
        <p className="text-body-sm text-error" role="alert">
          {err}
        </p>
      ) : null}

      <div className="flex flex-col gap-4 lg:flex-row">
        <nav
          className="flex shrink-0 flex-row flex-wrap gap-1 lg:w-52 lg:flex-col lg:flex-nowrap"
          aria-label="Product editor sections"
        >
          {productEditorTabs.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={cn(
                "rounded-lg px-3 py-2 text-left text-body-sm font-medium transition-colors",
                tab === t.id
                  ? "bg-beige text-forest shadow-sm"
                  : "text-ink-soft hover:bg-paper hover:text-forest",
              )}
            >
              {t.label}
            </button>
          ))}
        </nav>
        <Card className="min-w-0 flex-1">
          <h2 className="font-semibold text-forest">{title}</h2>

          {tab === "basics" ? (
            <div className="mt-6 space-y-4">
              <Input label="Name" name="name" value={name} onChange={(e) => setName(e.target.value)} />
              <Input label="Slug" name="slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
              <Input
                label="Short description"
                name="shortDesc"
                value={shortDesc}
                onChange={(e) => setShortDesc(e.target.value)}
              />
              <div>
                <label className="mb-1.5 block font-mono text-eyebrow font-semibold uppercase text-ink-muted">
                  Long description
                </label>
                <textarea
                  name="description"
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="min-h-[140px] w-full rounded-sm border border-line bg-paper p-3 text-body"
                />
              </div>
              <label className="flex items-center gap-2 text-body-sm">
                <input type="checkbox" checked={isFeatured} onChange={(e) => setIsFeatured(e.target.checked)} />
                Featured on home
              </label>
            </div>
          ) : null}

          {tab === "visibility" ? (
            <div className="mt-6 space-y-4">
              <Select label="Visibility" name="visibility" value={visibility} onChange={(e) => setVisibility(e.target.value)}>
                {VISIBILITY.map((v) => (
                  <option key={v} value={v}>
                    {v}
                  </option>
                ))}
              </Select>
              <Input
                label="Visibility note"
                name="visibilityNote"
                value={visibilityNote}
                onChange={(e) => setVisibilityNote(e.target.value)}
              />
              <Input
                label="Available from (local)"
                name="availableFrom"
                type="datetime-local"
                value={availableFrom}
                onChange={(e) => setAvailableFrom(e.target.value)}
              />
              <Input
                label="Available until (local)"
                name="availableUntil"
                type="datetime-local"
                value={availableUntil}
                onChange={(e) => setAvailableUntil(e.target.value)}
              />
              <Select
                label="Display badge"
                name="displayBadge"
                value={displayBadge}
                onChange={(e) => setDisplayBadge(e.target.value)}
              >
                {BADGES.map((b) => (
                  <option key={b || "none"} value={b}>
                    {b || "— none —"}
                  </option>
                ))}
              </Select>
            </div>
          ) : null}

          {tab === "pricing" ? (
            <div className="mt-6 space-y-4">
              <Input label="GST rate %" name="gstRate" value={gstRate} onChange={(e) => setGstRate(e.target.value)} />
              <Input label="HSN code" name="hsnCode" value={hsnCode} onChange={(e) => setHsnCode(e.target.value)} />
            </div>
          ) : null}

          {tab === "shipping" ? (
            <div className="mt-6 space-y-4">
              <label className="flex items-center gap-2 text-body-sm">
                <input type="checkbox" checked={codEnabled} onChange={(e) => setCodEnabled(e.target.checked)} />
                COD enabled
              </label>
              <label className="flex items-center gap-2 text-body-sm">
                <input
                  type="checkbox"
                  checked={onlinePaymentEnabled}
                  onChange={(e) => setOnlinePaymentEnabled(e.target.checked)}
                />
                Online payment enabled
              </label>
            </div>
          ) : null}

          {tab === "ordering" ? (
            <div className="mt-6 space-y-4">
              <label className="flex items-center gap-2 text-body-sm">
                <input type="checkbox" checked={allowBackorder} onChange={(e) => setAllowBackorder(e.target.checked)} />
                Allow backorder
              </label>
              <label className="flex items-center gap-2 text-body-sm">
                <input type="checkbox" checked={showStockCount} onChange={(e) => setShowStockCount(e.target.checked)} />
                Show stock count
              </label>
            </div>
          ) : null}

          {tab === "refund" ? (
            <div className="mt-6 space-y-4">
              <label className="flex items-center gap-2 text-body-sm">
                <input type="checkbox" checked={isRefundable} onChange={(e) => setIsRefundable(e.target.checked)} />
                Refundable
              </label>
              <Input
                label="Refund window (days)"
                name="refundWindowDays"
                value={refundWindowDays}
                onChange={(e) => setRefundWindowDays(e.target.value)}
              />
            </div>
          ) : null}

          {tab === "reviews" ? (
            <div className="mt-6 space-y-4">
              <label className="flex items-center gap-2 text-body-sm">
                <input type="checkbox" checked={reviewsEnabled} onChange={(e) => setReviewsEnabled(e.target.checked)} />
                Reviews enabled
              </label>
            </div>
          ) : null}

          {tab === "seo" ? (
            <div className="mt-6 space-y-4">
              <label className="mb-1.5 block font-mono text-eyebrow font-semibold uppercase text-ink-muted">
                SEO JSON
              </label>
              <textarea
                value={seoText}
                onChange={(e) => setSeoText(e.target.value)}
                className="min-h-[200px] w-full rounded-sm border border-line bg-paper p-3 font-mono text-xs"
                spellCheck={false}
              />
            </div>
          ) : null}

          {tab === "variants" ? (
            <div className="mt-6 space-y-6">
              <div className="overflow-x-auto">
                <table className="min-w-full text-left text-body-sm">
                  <thead className="font-mono text-eyebrow text-ink-muted">
                    <tr>
                      <th className="pb-2 pr-3">SKU</th>
                      <th className="pb-2 pr-3">Name</th>
                      <th className="pb-2 pr-3">MRP</th>
                      <th className="pb-2">Sale</th>
                    </tr>
                  </thead>
                  <tbody>
                    {variants.map((v) => (
                      <tr key={str(v.id)} className="border-t border-line">
                        <td className="py-2 pr-3 font-mono">{str(v.sku)}</td>
                        <td className="py-2 pr-3">{str(v.name)}</td>
                        <td className="py-2 pr-3">{str(v.priceMrp)}</td>
                        <td className="py-2">{str(v.priceSale)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <VariantAddForm productId={productId} />
            </div>
          ) : null}

          {tab === "media" ? (
            <div className="mt-6 space-y-6">
              <ul className="space-y-2 text-body-sm">
                {media.map((m) => (
                  <li key={str(m.id)} className="rounded border border-line bg-cream px-3 py-2">
                    <span className="font-mono text-xs">{str(m.type)}</span> · {str(m.url)}
                  </li>
                ))}
              </ul>
              <MediaAddForm productId={productId} />
            </div>
          ) : null}

          {tab === "faqs" ? (
            <pre className="mt-6 max-h-80 overflow-auto rounded border border-line bg-cream p-3 text-xs">
              {JSON.stringify(faqs, null, 2)}
            </pre>
          ) : null}

          {tab === "inventory" ? (
            <pre className="mt-6 max-h-80 overflow-auto rounded border border-line bg-cream p-3 text-xs">
              {JSON.stringify(variants.map((v) => ({ id: v.id, sku: v.sku, inventory: v.inventory })), null, 2)}
            </pre>
          ) : null}

          {["basics", "visibility", "pricing", "shipping", "ordering", "refund", "reviews", "seo"].includes(tab) ? (
            <div className="mt-8 border-t border-line pt-4">
              <Button type="button" variant="primaryForest" size="md" disabled={saving} onClick={() => void saveCore()}>
                {saving ? "Saving…" : "Save changes"}
              </Button>
            </div>
          ) : null}
        </Card>
      </div>

      <Link href="/admin/products" className="text-body-sm text-gold-deep hover:underline">
        ← Products
      </Link>
    </div>
  );
}

function VariantAddForm({ productId }: { productId: string }) {
  const router = useRouter();
  const [sku, setSku] = useState("");
  const [variantName, setVariantName] = useState("");
  const [priceMrp, setPriceMrp] = useState("");
  const [priceSale, setPriceSale] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

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
          isDefault: false,
          isActive: true,
        },
      });
      setSku("");
      setVariantName("");
      setPriceMrp("");
      setPriceSale("");
      router.refresh();
    } catch (e) {
      setMsg(e instanceof ApiError ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-lg border border-dashed border-line p-4">
      <h3 className="font-semibold text-forest">Add variant</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Input label="SKU" value={sku} onChange={(e) => setSku(e.target.value)} />
        <Input label="Variant name" value={variantName} onChange={(e) => setVariantName(e.target.value)} />
        <Input label="MRP" value={priceMrp} onChange={(e) => setPriceMrp(e.target.value)} />
        <Input label="Sale price" value={priceSale} onChange={(e) => setPriceSale(e.target.value)} />
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
  );
}

function MediaAddForm({ productId }: { productId: string }) {
  const router = useRouter();
  const [url, setUrl] = useState("");
  const [altText, setAltText] = useState("");
  const [order, setOrder] = useState("0");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  async function add() {
    setMsg(null);
    setBusy(true);
    try {
      await clientApiJson(`/v1/admin/products/${encodeURIComponent(productId)}/media`, {
        method: "POST",
        json: {
          type: "IMAGE",
          url: url.trim(),
          altText: altText.trim() || null,
          order: Number(order) || 0,
        },
      });
      setUrl("");
      setAltText("");
      setOrder("0");
      router.refresh();
    } catch (e) {
      setMsg(e instanceof ApiError ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-lg border border-dashed border-line p-4">
      <h3 className="font-semibold text-forest">Add media (image URL)</h3>
      <div className="mt-4 grid gap-3 sm:grid-cols-2">
        <Input className="sm:col-span-2" label="URL" value={url} onChange={(e) => setUrl(e.target.value)} />
        <Input label="Alt text" value={altText} onChange={(e) => setAltText(e.target.value)} />
        <Input label="Order" value={order} onChange={(e) => setOrder(e.target.value)} />
      </div>
      {msg ? (
        <p className="mt-2 text-body-sm text-error" role="alert">
          {msg}
        </p>
      ) : null}
      <Button type="button" className="mt-3" variant="secondary" size="sm" disabled={busy} onClick={() => void add()}>
        {busy ? "Adding…" : "Add media"}
      </Button>
    </div>
  );
}
