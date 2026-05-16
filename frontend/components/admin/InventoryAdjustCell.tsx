"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { ApiError, clientApiJson } from "@/lib/client-api";

const REASONS = [
  "MANUAL_ADD",
  "MANUAL_DEDUCT",
  "ORDER_RESERVE",
  "ORDER_CONFIRM",
  "ORDER_CANCEL",
  "ORDER_REFUND",
  "IMPORT",
  "INITIAL",
] as const;

export type InventoryAdjustCellProps = { inventoryId: string };

/**
 * Stock adjustment — `POST /v1/admin/inventory/:id/adjust`.
 */
export function InventoryAdjustCell({ inventoryId }: InventoryAdjustCellProps) {
  const router = useRouter();
  const [delta, setDelta] = useState("");
  const [reason, setReason] = useState<string>(REASONS[0]);
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function apply() {
    setErr(null);
    setBusy(true);
    try {
      await clientApiJson(`/v1/admin/inventory/${encodeURIComponent(inventoryId)}/adjust`, {
        method: "POST",
        json: { delta: Number(delta), reason, note: note.trim() || null },
      });
      setDelta("");
      setNote("");
      router.refresh();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Adjust failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex flex-wrap items-end gap-2">
      <Input label="Delta qty" className="w-24" value={delta} onChange={(e) => setDelta(e.target.value)} />
      <div className="min-w-[140px]">
        <Select label="Reason" value={reason} onChange={(e) => setReason(e.target.value)}>
          {REASONS.map((r) => (
            <option key={r} value={r}>
              {r}
            </option>
          ))}
        </Select>
      </div>
      <Input className="min-w-[120px] flex-1" label="Note" value={note} onChange={(e) => setNote(e.target.value)} />
      <Button type="button" size="sm" variant="secondary" disabled={busy} onClick={() => void apply()}>
        Apply
      </Button>
      {err ? (
        <p className="w-full text-xs text-error" role="alert">
          {err}
        </p>
      ) : null}
    </div>
  );
}
