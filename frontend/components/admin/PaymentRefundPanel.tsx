"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ApiError, clientApiJson } from "@/lib/client-api";

export type PaymentRefundPanelProps = {
  paymentId: string;
  refundable: boolean;
};

/**
 * Manual refund — `POST /v1/admin/payments/:id/refund`.
 */
export function PaymentRefundPanel({ paymentId, refundable }: PaymentRefundPanelProps) {
  const router = useRouter();
  const [amountInr, setAmountInr] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function submit() {
    setErr(null);
    setOk(false);
    setBusy(true);
    try {
      const raw = amountInr.trim();
      const amt = raw === "" ? null : Number(raw);
      await clientApiJson(`/v1/admin/payments/${encodeURIComponent(paymentId)}/refund`, {
        method: "POST",
        json: {
          amountInr: amt != null && Number.isFinite(amt) && amt > 0 ? amt : null,
          reason: reason.trim() || null,
        },
      });
      setOk(true);
      setAmountInr("");
      setReason("");
      router.refresh();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Refund failed.");
    } finally {
      setBusy(false);
    }
  }

  if (!refundable) {
    return <p className="text-body-sm text-ink-muted">This payment is not in a refundable state.</p>;
  }

  return (
    <div className="mt-4 space-y-3">
      <p className="text-body-sm text-ink-muted">Partial amount in ₹ (empty = refund remaining balance).</p>
      <Input
        label="Amount (INR)"
        name="amountInr"
        type="number"
        step="0.01"
        min={0}
        value={amountInr}
        onChange={(e) => setAmountInr(e.target.value)}
      />
      <Input label="Reason" name="reason" value={reason} onChange={(e) => setReason(e.target.value)} />
      <Button variant="primaryGold" size="md" type="button" disabled={busy} onClick={() => void submit()}>
        {busy ? "Processing…" : "Trigger refund"}
      </Button>
      {ok ? <p className="text-body-sm text-success">Refund recorded.</p> : null}
      {err ? <p className="text-body-sm text-error">{err}</p> : null}
    </div>
  );
}
