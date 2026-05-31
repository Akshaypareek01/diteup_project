"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ApiError, clientApiJson } from "@/lib/client-api";

export type AdminBroadcastRowActionsProps = {
  broadcastId: string;
  status: string;
};

/**
 * Send, preview, and test actions for a broadcast draft.
 */
export function AdminBroadcastRowActions({ broadcastId, status }: AdminBroadcastRowActionsProps) {
  const router = useRouter();
  const [busy, setBusy] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [preview, setPreview] = useState<{ subject: string; html: string } | null>(null);
  const [sendResult, setSendResult] = useState<string | null>(null);

  const canSend = status === "DRAFT" || status === "SENDING";

  async function loadPreview() {
    setErr(null);
    setBusy("preview");
    try {
      const data = await clientApiJson<{ mergedSubject?: string; mergedHtml?: string }>(
        `/v1/admin/broadcasts/${encodeURIComponent(broadcastId)}/preview`,
      );
      setPreview({
        subject: data.mergedSubject ?? "(no subject)",
        html: data.mergedHtml ?? "",
      });
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Preview failed.");
    } finally {
      setBusy(null);
    }
  }

  async function sendTest() {
    setErr(null);
    setBusy("test");
    try {
      await clientApiJson(`/v1/admin/broadcasts/${encodeURIComponent(broadcastId)}/send-test`, {
        method: "POST",
        json: {},
      });
      setSendResult("Test email sent to your admin address.");
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Send test failed.");
    } finally {
      setBusy(null);
    }
  }

  async function sendNow() {
    if (!window.confirm("Send this broadcast to all recipients in the segment now?")) return;
    setErr(null);
    setBusy("send");
    try {
      const data = await clientApiJson<{ sent?: number; failed?: number }>(
        `/v1/admin/broadcasts/${encodeURIComponent(broadcastId)}/send`,
        { method: "POST", json: {} },
      );
      setSendResult(`Sent ${data.sent ?? 0}, failed ${data.failed ?? 0}.`);
      router.refresh();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Send failed.");
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="mt-3 space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button variant="secondary" size="sm" type="button" disabled={busy != null} onClick={() => void loadPreview()}>
          {busy === "preview" ? "Loading…" : "Preview"}
        </Button>
        <Button variant="secondary" size="sm" type="button" disabled={busy != null} onClick={() => void sendTest()}>
          {busy === "test" ? "Sending…" : "Send test to me"}
        </Button>
        {canSend ? (
          <Button variant="primaryGold" size="sm" type="button" disabled={busy != null} onClick={() => void sendNow()}>
            {busy === "send" ? "Sending…" : "Send now"}
          </Button>
        ) : null}
      </div>
      {sendResult ? <p className="text-body-sm text-success">{sendResult}</p> : null}
      {err ? <p className="text-body-sm text-error">{err}</p> : null}
      {preview ? (
        <div className="rounded border border-line bg-cream p-3">
          <p className="font-semibold text-forest">{preview.subject}</p>
          <div
            className="prose prose-sm mt-2 max-h-64 overflow-auto text-body-sm"
            dangerouslySetInnerHTML={{ __html: preview.html }}
          />
        </div>
      ) : null}
    </div>
  );
}
