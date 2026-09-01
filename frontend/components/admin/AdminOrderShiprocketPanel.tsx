"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ApiError, clientApiJson } from "@/lib/client-api";
import { formatIstDateTime } from "@/lib/format-ist";

export type ShiprocketPushStatus = "PENDING" | "PUSHED" | "FAILED";

export type AdminOrderShiprocketPanelProps = {
  orderId: string;
  orderNumber: string;
  shiprocketOrderId: string | null;
  shiprocketShipmentId: string | null;
  shiprocketChannelOrderId: string | null;
  shiprocketPushStatus: ShiprocketPushStatus | null;
  shiprocketPushError: string | null;
  shiprocketLastStatus: string | null;
  shiprocketStatusAt: string | null;
  awbNumber: string | null;
  shippingCarrier: string | null;
};

/**
 * True when the last known Shiprocket status is a canceled shipment.
 *
 * @param status raw webhook or API status text
 */
function isCanceledShiprocketStatus(status: string | null): boolean {
  const normalized = String(status ?? "")
    .trim()
    .toUpperCase();
  return normalized === "CANCELED" || normalized === "CANCELLED";
}

function PushStatusBadge({
  status,
  lastStatus,
}: {
  status: ShiprocketPushStatus | null;
  lastStatus: string | null;
}) {
  if (status === "PUSHED" && isCanceledShiprocketStatus(lastStatus)) {
    return <Badge variant="warning">Pushed but canceled</Badge>;
  }
  if (status === "PUSHED") return <Badge variant="success">Pushed</Badge>;
  if (status === "PENDING") return <Badge variant="warning">Pending</Badge>;
  if (status === "FAILED") {
    return (
      <Badge variant="outline" className="border-transparent bg-error text-cream">
        Failed
      </Badge>
    );
  }
  return <Badge variant="outline">Not pushed</Badge>;
}

/**
 * Shiprocket push state + manual push — `POST /v1/admin/orders/:id/shiprocket/push`.
 */
export function AdminOrderShiprocketPanel({
  orderId,
  orderNumber,
  shiprocketOrderId,
  shiprocketShipmentId,
  shiprocketChannelOrderId,
  shiprocketPushStatus,
  shiprocketPushError,
  shiprocketLastStatus,
  shiprocketStatusAt,
  awbNumber,
  shippingCarrier,
}: AdminOrderShiprocketPanelProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [ok, setOk] = useState(false);

  async function push() {
    setErr(null);
    setOk(false);
    setBusy(true);
    try {
      await clientApiJson(`/v1/admin/orders/${encodeURIComponent(orderId)}/shiprocket/push`, {
        method: "POST",
        json: {},
      });
      setOk(true);
      router.refresh();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Push to Shiprocket failed.");
    } finally {
      setBusy(false);
    }
  }

  const searchId = shiprocketChannelOrderId?.trim() || orderNumber;
  const alreadyPushed = shiprocketPushStatus === "PUSHED";

  const rows: Array<{ label: string; value: string }> = [];
  rows.push({ label: "Search in Shiprocket", value: searchId });
  if (shiprocketOrderId) rows.push({ label: "Shiprocket order ID", value: shiprocketOrderId });
  if (shiprocketShipmentId) rows.push({ label: "Shipment ID", value: shiprocketShipmentId });
  if (awbNumber) {
    rows.push({ label: "AWB", value: shippingCarrier ? `${awbNumber} · ${shippingCarrier}` : awbNumber });
  }
  if (shiprocketLastStatus) {
    rows.push({
      label: "Last webhook status",
      value: shiprocketStatusAt
        ? `${shiprocketLastStatus} · ${formatIstDateTime(shiprocketStatusAt)}`
        : shiprocketLastStatus,
    });
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <span className="text-body-sm text-ink-muted">Push status</span>
        <PushStatusBadge status={shiprocketPushStatus} lastStatus={shiprocketLastStatus} />
      </div>

      {rows.length > 0 ? (
        <dl className="space-y-2 text-body-sm">
          {rows.map((r) => (
            <div key={r.label}>
              <dt className="text-ink-muted">{r.label}</dt>
              <dd className="font-mono text-forest">{r.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}

      {shiprocketPushStatus === "FAILED" && shiprocketPushError ? (
        <p className="whitespace-pre-wrap break-words text-body-sm text-error" role="alert">
          {shiprocketPushError}
        </p>
      ) : null}

      {alreadyPushed && !isCanceledShiprocketStatus(shiprocketLastStatus) ? (
        <p className="text-body-sm text-ink-muted">
          Already pushed to Shiprocket — updates arrive via webhook. Recreate only if the order is
          missing or canceled on their side.
        </p>
      ) : null}

      <Button variant="primaryGold" size="md" type="button" disabled={busy} onClick={() => void push()}>
        {busy
          ? "Pushing…"
          : alreadyPushed
            ? "Push / recreate in Shiprocket"
            : shiprocketPushStatus === "FAILED"
              ? "Retry push"
              : "Push to Shiprocket"}
      </Button>

      {ok ? <p className="text-body-sm text-success">Pushed to Shiprocket.</p> : null}
      {err ? <p className="text-body-sm text-error">{err}</p> : null}
    </div>
  );
}
