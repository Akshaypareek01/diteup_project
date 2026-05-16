"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { ApiError, clientApiJson } from "@/lib/client-api";

const VISIBILITY = ["DRAFT", "PUBLISHED", "HIDDEN", "COMING_SOON", "OUT_OF_STOCK", "UNDER_MAINTENANCE", "ARCHIVED"];

/**
 * Creates a product + first variant — `POST /v1/admin/products`.
 */
export function AdminNewProductForm() {
  const router = useRouter();
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [sku, setSku] = useState("");
  const [variantName, setVariantName] = useState("");
  const [priceMrp, setPriceMrp] = useState("");
  const [priceSale, setPriceSale] = useState("");
  const [visibility, setVisibility] = useState("DRAFT");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const created = (await clientApiJson<{ id: string }>("/v1/admin/products", {
        method: "POST",
        json: {
          slug: slug.trim().toLowerCase(),
          name: name.trim(),
          description: description.trim(),
          sku: sku.trim(),
          variantName: variantName.trim(),
          priceMrp: Number(priceMrp),
          priceSale: Number(priceSale),
          visibility,
        },
      })) as { id?: string };
      if (created?.id) {
        router.push(`/admin/products/${encodeURIComponent(created.id)}`);
        router.refresh();
      }
    } catch (e2) {
      setErr(e2 instanceof ApiError ? e2.message : "Create failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="mx-auto max-w-xl space-y-4" onSubmit={submit}>
      <Input label="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} required />
      <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} required />
      <div>
        <label className="mb-1.5 block font-mono text-eyebrow font-semibold uppercase text-ink-muted">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
          className="min-h-[100px] w-full rounded-sm border border-line bg-paper p-3 text-body"
        />
      </div>
      <Input label="First variant SKU" value={sku} onChange={(e) => setSku(e.target.value)} required />
      <Input label="Variant name" value={variantName} onChange={(e) => setVariantName(e.target.value)} required />
      <Input label="MRP" value={priceMrp} onChange={(e) => setPriceMrp(e.target.value)} required />
      <Input label="Sale price" value={priceSale} onChange={(e) => setPriceSale(e.target.value)} required />
      <Select label="Visibility" value={visibility} onChange={(e) => setVisibility(e.target.value)}>
        {VISIBILITY.map((v) => (
          <option key={v} value={v}>
            {v}
          </option>
        ))}
      </Select>
      {err ? (
        <p className="text-body-sm text-error" role="alert">
          {err}
        </p>
      ) : null}
      <Button type="submit" variant="primaryForest" size="lg" disabled={busy}>
        {busy ? "Creating…" : "Create product"}
      </Button>
    </form>
  );
}
