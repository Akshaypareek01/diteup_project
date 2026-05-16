"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ApiError, clientApiJson } from "@/lib/client-api";

type SegmentPayload = { type: "MARKETING_OPT_IN" };

/**
 * Creates a draft broadcast — `POST /v1/admin/broadcasts`.
 */
export function AdminBroadcastCreateForm() {
  const router = useRouter();
  const [subject, setSubject] = useState("");
  const [bodyHtml, setBodyHtml] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function create() {
    setErr(null);
    setBusy(true);
    try {
      const segment: SegmentPayload = { type: "MARKETING_OPT_IN" };
      await clientApiJson<{ broadcast?: { id: string } }>(`/v1/admin/broadcasts`, {
        method: "POST",
        json: {
          subject: subject.trim(),
          bodyHtml,
          segment,
          scheduledAt: null,
        },
      });
      setSubject("");
      setBodyHtml("");
      router.refresh();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Could not create broadcast.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      <Input label="Subject" name="subject" value={subject} onChange={(e) => setSubject(e.target.value)} />
      <div>
        <label className="mb-1.5 block font-mono text-eyebrow font-semibold uppercase text-ink-muted" htmlFor="broadcast-body">
          Body (HTML)
        </label>
        <textarea
          id="broadcast-body"
          className="min-h-[200px] w-full rounded-sm border border-line bg-paper p-3 text-body"
          value={bodyHtml}
          onChange={(e) => setBodyHtml(e.target.value)}
          aria-label="Broadcast body HTML"
        />
      </div>
      <p className="text-body-sm text-ink-muted">Segment: marketing opt-in users (API segment type MARKETING_OPT_IN).</p>
      <Button variant="primaryGold" size="md" type="button" disabled={busy} onClick={() => void create()}>
        {busy ? "Saving…" : "Save draft"}
      </Button>
      {err ? <p className="text-body-sm text-error">{err}</p> : null}
    </div>
  );
}
