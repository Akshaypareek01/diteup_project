"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Select } from "@/components/ui/Select";
import { ApiError, clientApiJson } from "@/lib/client-api";

const NEXT_STATUS: Record<string, string[]> = {
  PLACED: ["CONFIRMED", "CANCELLED"],
  CONFIRMED: ["SHIPPED", "CANCELLED"],
  SHIPPED: ["DELIVERED"],
  DELIVERED: [],
  CANCELLED: [],
  RETURNED: [],
  REFUNDED: [],
};

export type AdminOrderStatusPanelProps = {
  orderId: string;
  currentStatus: string;
};

/**
 * Updates fulfilment status — `PATCH /v1/admin/orders/:id/status`.
 */
export function AdminOrderStatusPanel({ orderId, currentStatus }: AdminOrderStatusPanelProps) {
  const router = useRouter();
  const options = useMemo(() => NEXT_STATUS[currentStatus] ?? [], [currentStatus]);
  const [status, setStatus] = useState(options[0] ?? "");
  const [awbNumber, setAwbNumber] = useState("");
  const [shippingCarrier, setShippingCarrier] = useState("");
  const [notes, setNotes] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  if (options.length === 0) {
    return (
      <p className="text-body-sm text-ink-muted">
        No further status transitions available from <strong>{currentStatus}</strong>.
      </p>
    );
  }

  async function submit() {
    if (!status) return;
    setErr(null);
    setOk(false);
    setBusy(true);
    try {
      await clientApiJson(`/v1/admin/orders/${encodeURIComponent(orderId)}/status`, {
        method: "PATCH",
        json: {
          status,
          awbNumber: awbNumber.trim() || null,
          shippingCarrier: shippingCarrier.trim() || null,
          notes: notes.trim() || null,
        },
      });
      setOk(true);
      router.refresh();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Status update failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-3">
      <Select
        label="New status"
        name="orderStatus"
        value={status}
        onChange={(e) => setStatus(e.target.value)}
      >
        {options.map((s) => (
          <option key={s} value={s}>
            {s.replace(/_/g, " ")}
          </option>
        ))}
      </Select>
      {status === "SHIPPED" ? (
        <>
          <Input
            label="AWB / tracking number"
            name="awb"
            value={awbNumber}
            onChange={(e) => setAwbNumber(e.target.value)}
          />
          <Input
            label="Carrier"
            name="carrier"
            value={shippingCarrier}
            onChange={(e) => setShippingCarrier(e.target.value)}
            placeholder="Delhivery, Blue Dart…"
          />
        </>
      ) : null}
      {status === "CANCELLED" ? (
        <Input label="Notes (optional)" name="notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
      ) : null}
      <Button variant="primaryGold" size="md" type="button" disabled={busy || !status} onClick={() => void submit()}>
        {busy ? "Updating…" : "Update status"}
      </Button>
      {ok ? <p className="text-body-sm text-success">Status updated.</p> : null}
      {err ? <p className="text-body-sm text-error">{err}</p> : null}
    </div>
  );
}
