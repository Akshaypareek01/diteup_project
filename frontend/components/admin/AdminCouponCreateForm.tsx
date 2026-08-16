"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { ApiError, clientApiJson } from "@/lib/client-api";

const COUPON_TYPES = ["FLAT", "PERCENT", "FREE_SHIPPING"] as const;
type CouponType = (typeof COUPON_TYPES)[number];

/**
 * Parses an optional numeric field; empty → null.
 */
function optNumber(raw: string): number | null {
  const t = raw.trim();
  if (!t) return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : null;
}

/**
 * Converts `datetime-local` to ISO, or null when blank.
 */
function optIso(local: string): string | null {
  if (!local.trim()) return null;
  const d = new Date(local);
  return Number.isFinite(d.getTime()) ? d.toISOString() : null;
}

/**
 * Creates a coupon — `POST /v1/admin/coupons`.
 */
export function AdminCouponCreateForm() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [type, setType] = useState<CouponType>("PERCENT");
  const [value, setValue] = useState("");
  const [description, setDescription] = useState("");
  const [minOrder, setMinOrder] = useState("");
  const [maxDiscount, setMaxDiscount] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [perUserLimit, setPerUserLimit] = useState("1");
  const [firstOrderOnly, setFirstOrderOnly] = useState(false);
  const [appliesToCOD, setAppliesToCOD] = useState(true);
  const [startsAt, setStartsAt] = useState("");
  const [endsAt, setEndsAt] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const created = await clientApiJson<{ coupon?: { id: string } }>("/v1/admin/coupons", {
        method: "POST",
        json: {
          code: code.trim().toUpperCase(),
          type,
          value: type === "FREE_SHIPPING" ? 0 : Number(value),
          description: description.trim() || null,
          minOrder: optNumber(minOrder),
          maxDiscount: optNumber(maxDiscount),
          usageLimit: optNumber(usageLimit),
          perUserLimit: optNumber(perUserLimit) ?? 1,
          firstOrderOnly,
          appliesToCOD,
          startsAt: optIso(startsAt),
          endsAt: optIso(endsAt),
          isActive,
        },
      });
      const id = created.coupon?.id;
      if (id) {
        router.push(`/admin/coupons/${encodeURIComponent(id)}`);
        router.refresh();
        return;
      }
      router.push("/admin/coupons");
      router.refresh();
    } catch (e2) {
      setErr(e2 instanceof ApiError ? e2.message : "Could not create coupon.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form className="mx-auto max-w-xl space-y-4" onSubmit={(e) => void submit(e)}>
      <Input
        label="Code"
        value={code}
        onChange={(e) => setCode(e.target.value.toUpperCase())}
        required
        autoComplete="off"
        placeholder="WELCOME10"
      />
      <Select
        label="Type"
        value={type}
        onChange={(e) => setType(e.target.value as CouponType)}
      >
        {COUPON_TYPES.map((t) => (
          <option key={t} value={t}>
            {t === "FLAT" ? "Flat ₹ off" : t === "PERCENT" ? "Percent off" : "Free shipping"}
          </option>
        ))}
      </Select>
      {type !== "FREE_SHIPPING" ? (
        <Input
          label={type === "PERCENT" ? "Percent" : "Amount (₹)"}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          required
          inputMode="decimal"
        />
      ) : null}
      <Input label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
      <div className="grid gap-4 sm:grid-cols-2">
        <Input
          label="Min order (₹)"
          value={minOrder}
          onChange={(e) => setMinOrder(e.target.value)}
          inputMode="decimal"
        />
        <Input
          label="Max discount (₹)"
          value={maxDiscount}
          onChange={(e) => setMaxDiscount(e.target.value)}
          inputMode="decimal"
          hint={type === "PERCENT" ? "Cap on percent off" : undefined}
        />
        <Input
          label="Usage limit"
          value={usageLimit}
          onChange={(e) => setUsageLimit(e.target.value)}
          inputMode="numeric"
          hint="Blank = unlimited"
        />
        <Input
          label="Per-user limit"
          value={perUserLimit}
          onChange={(e) => setPerUserLimit(e.target.value)}
          inputMode="numeric"
        />
        <Input label="Starts" type="datetime-local" value={startsAt} onChange={(e) => setStartsAt(e.target.value)} />
        <Input label="Ends" type="datetime-local" value={endsAt} onChange={(e) => setEndsAt(e.target.value)} />
      </div>
      <label className="flex items-center gap-2 text-body-sm text-ink">
        <input type="checkbox" checked={isActive} onChange={(e) => setIsActive(e.target.checked)} />
        Active
      </label>
      <label className="flex items-center gap-2 text-body-sm text-ink">
        <input type="checkbox" checked={firstOrderOnly} onChange={(e) => setFirstOrderOnly(e.target.checked)} />
        First order only
      </label>
      <label className="flex items-center gap-2 text-body-sm text-ink">
        <input type="checkbox" checked={appliesToCOD} onChange={(e) => setAppliesToCOD(e.target.checked)} />
        Applies to COD
      </label>
      {err ? (
        <p className="text-body-sm text-error" role="alert">
          {err}
        </p>
      ) : null}
      <Button type="submit" variant="primaryForest" size="lg" disabled={busy}>
        {busy ? "Creating…" : "Create coupon"}
      </Button>
    </form>
  );
}
