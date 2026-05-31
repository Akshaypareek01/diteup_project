"use client";

import { useCallback, useState } from "react";
import { Button } from "@/components/ui/Button";
import { ApiError, clientApiJson } from "@/lib/client-api";

type LedgerEntry = {
  id: string;
  delta: number;
  reason: string;
  note: string | null;
  createdAt: string;
};

export type AdminInventoryLedgerPanelProps = {
  inventoryId: string;
  sku: string;
};

/**
 * Loads stock ledger entries — `GET /v1/admin/inventory/:id/ledger`.
 */
export function AdminInventoryLedgerPanel({ inventoryId, sku }: AdminInventoryLedgerPanelProps) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [entries, setEntries] = useState<LedgerEntry[]>([]);

  const load = useCallback(async () => {
    setErr(null);
    setBusy(true);
    try {
      const data = await clientApiJson<{ entries?: LedgerEntry[] }>(
        `/v1/admin/inventory/${encodeURIComponent(inventoryId)}/ledger?limit=50`,
      );
      setEntries(data.entries ?? []);
      setOpen(true);
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Could not load ledger.");
    } finally {
      setBusy(false);
    }
  }, [inventoryId]);

  return (
    <div className="mt-1">
      <Button variant="secondary" size="sm" type="button" disabled={busy} onClick={() => void load()}>
        {busy ? "Loading…" : open ? "Refresh history" : "View history"}
      </Button>
      {err ? <p className="mt-1 text-xs text-error">{err}</p> : null}
      {open && entries.length > 0 ? (
        <ul className="mt-2 max-h-40 space-y-1 overflow-auto rounded border border-line bg-cream p-2 text-xs">
          {entries.map((e) => (
            <li key={e.id}>
              <span className="font-mono">{new Date(e.createdAt).toLocaleString()}</span>
              {" · "}
              <span className={e.delta >= 0 ? "text-success" : "text-error"}>
                {e.delta >= 0 ? "+" : ""}
                {e.delta}
              </span>
              {" · "}
              {e.reason}
              {e.note ? ` — ${e.note}` : ""}
            </li>
          ))}
        </ul>
      ) : open ? (
        <p className="mt-2 text-xs text-ink-muted">No ledger entries for {sku}.</p>
      ) : null}
    </div>
  );
}
