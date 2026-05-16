"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { ApiError, clientApiJson } from "@/lib/client-api";

export type ReviewModerationActionsProps = {
  reviewId: string;
  isApproved: boolean;
};

type ModerateAction = "approve" | "reject" | "feature" | "unfeature";

/**
 * Row actions for review moderation — `PATCH /v1/admin/reviews/:id`.
 */
export function ReviewModerationActions({ reviewId, isApproved }: ReviewModerationActionsProps) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function run(action: ModerateAction, extra?: { rejectReason?: string; adminReply?: string | null }) {
    setErr(null);
    setBusy(true);
    try {
      await clientApiJson(`/v1/admin/reviews/${encodeURIComponent(reviewId)}`, {
        method: "PATCH",
        json: {
          action,
          rejectReason: extra?.rejectReason ?? null,
          adminReply: extra?.adminReply ?? null,
        },
      });
      router.refresh();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Update failed.");
    } finally {
      setBusy(false);
    }
  }

  async function approveWithOptionalReply() {
    const reply = window.prompt("Optional public reply on approve (leave empty to skip):");
    if (reply === null) return;
    await run("approve", { adminReply: reply.trim() ? reply.trim() : null });
  }

  async function reject() {
    const reason = window.prompt("Reject reason:");
    if (reason === null) return;
    await run("reject", { rejectReason: reason.trim() || "Rejected" });
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <div className="flex flex-wrap justify-end gap-1">
        <Button variant="secondary" size="sm" type="button" disabled={busy} onClick={() => approveWithOptionalReply()}>
          Approve
        </Button>
        <Button variant="secondary" size="sm" type="button" disabled={busy} onClick={() => reject()}>
          Reject
        </Button>
        <Button
          variant="secondary"
          size="sm"
          type="button"
          disabled={busy || !isApproved}
          onClick={() => run("feature")}
        >
          Feature
        </Button>
        <Button variant="secondary" size="sm" type="button" disabled={busy} onClick={() => run("unfeature")}>
          Unfeature
        </Button>
      </div>
      {err ? <p className="text-xs text-error">{err}</p> : null}
    </div>
  );
}
