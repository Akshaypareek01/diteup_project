"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Toggle } from "@/components/ui/Toggle";
import { ApiError, clientApiJson } from "@/lib/client-api";

export type UserRestrictionsPanelProps = {
  userId: string;
  userRole: string;
  initialRestrictions: Record<string, unknown> | null | undefined;
  initialTags: string[];
  initialAdminNotes: string | null;
  initialIsActive: boolean;
};

function readBool(obj: Record<string, unknown> | null | undefined, key: string): boolean {
  if (!obj || typeof obj !== "object") return false;
  const v = obj[key];
  return v === true;
}

/**
 * Admin user restrictions + notes — `PATCH /v1/admin/users/:id`, force logout, anonymize.
 */
export function UserRestrictionsPanel({
  userId,
  userRole,
  initialRestrictions,
  initialTags,
  initialAdminNotes,
  initialIsActive,
}: UserRestrictionsPanelProps) {
  const router = useRouter();
  const baseRestrictions = useMemo(
    () => (initialRestrictions && typeof initialRestrictions === "object" ? initialRestrictions : {}) as Record<
      string,
      unknown
    >,
    [initialRestrictions],
  );

  const [blockCheckout, setBlockCheckout] = useState(() => readBool(baseRestrictions, "blockCheckout"));
  const [blockCod, setBlockCod] = useState(() => readBool(baseRestrictions, "blockCod"));
  const [tagsCsv, setTagsCsv] = useState(() => initialTags.join(", "));
  const [adminNotes, setAdminNotes] = useState(() => initialAdminNotes ?? "");
  const [isActive, setIsActive] = useState(initialIsActive);
  const [deactivationReason, setDeactivationReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function savePatch() {
    setErr(null);
    setBusy(true);
    try {
      const tags = tagsCsv
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);
      const restrictions: Record<string, unknown> = {
        ...baseRestrictions,
        blockCheckout,
        blockCod,
      };
      await clientApiJson(`/v1/admin/users/${encodeURIComponent(userId)}`, {
        method: "PATCH",
        json: {
          restrictions,
          tags,
          adminNotes: adminNotes.trim() || null,
          isActive,
          deactivationReason: !isActive && deactivationReason.trim() ? deactivationReason.trim() : null,
        },
      });
      router.refresh();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Save failed.");
    } finally {
      setBusy(false);
    }
  }

  async function forceLogout() {
    if (!window.confirm("Invalidate all sessions for this user?")) return;
    setErr(null);
    setBusy(true);
    try {
      await clientApiJson(`/v1/admin/users/${encodeURIComponent(userId)}/force-logout`, { method: "POST" });
      router.refresh();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Force logout failed.");
    } finally {
      setBusy(false);
    }
  }

  async function anonymize() {
    if (!window.confirm("Permanently anonymize this account? This cannot be undone.")) return;
    setErr(null);
    setBusy(true);
    try {
      await clientApiJson(`/v1/admin/users/${encodeURIComponent(userId)}/anonymize`, { method: "POST" });
      router.push("/admin/users");
      router.refresh();
    } catch (e) {
      setErr(e instanceof ApiError ? e.message : "Anonymize failed.");
    } finally {
      setBusy(false);
    }
  }

  const canAnonymize = userRole !== "ADMIN";

  return (
    <div className="space-y-4">
      <Toggle label="Block checkout" checked={blockCheckout} onCheckedChange={setBlockCheckout} />
      <Toggle label="Block COD" checked={blockCod} onCheckedChange={setBlockCod} />
      <Toggle label="Account active" checked={isActive} onCheckedChange={setIsActive} />
      {!isActive ? (
        <Input
          label="Deactivation reason (optional)"
          name="deactivationReason"
          value={deactivationReason}
          onChange={(e) => setDeactivationReason(e.target.value)}
        />
      ) : null}
      <Input label="Tags (comma-separated)" name="tags" value={tagsCsv} onChange={(e) => setTagsCsv(e.target.value)} />
      <div>
        <label className="mb-1.5 block font-mono text-eyebrow font-semibold uppercase text-ink-muted" htmlFor="admin-notes">
          Admin notes
        </label>
        <textarea
          id="admin-notes"
          className="min-h-[100px] w-full rounded-sm border border-line bg-paper p-3 text-body-sm"
          value={adminNotes}
          onChange={(e) => setAdminNotes(e.target.value)}
          aria-label="Admin notes"
        />
      </div>
      <div className="flex flex-wrap gap-2">
        <Button variant="primaryGold" size="md" type="button" disabled={busy} onClick={() => void savePatch()}>
          {busy ? "Saving…" : "Save changes"}
        </Button>
        <Button variant="secondary" size="md" type="button" disabled={busy} onClick={() => void forceLogout()}>
          Force logout
        </Button>
        {canAnonymize ? (
          <Button variant="secondary" size="md" type="button" disabled={busy} onClick={() => void anonymize()}>
            Anonymize user
          </Button>
        ) : null}
      </div>
      {err ? <p className="text-body-sm text-error">{err}</p> : null}
    </div>
  );
}
