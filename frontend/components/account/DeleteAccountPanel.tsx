"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ApiError, clientApiJson } from "@/lib/client-api";

/**
 * Hard anonymize flow — matches `DELETE /v1/me` body schema.
 */
export function DeleteAccountPanel() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    setBusy(true);
    try {
      await clientApiJson(`/v1/me`, {
        method: "DELETE",
        json: {
          currentPassword: password,
          confirm: "DELETE MY ACCOUNT" as const,
          reason: reason.trim() || undefined,
        },
      });
      setMsg("Your account data has been removed.");
      setPassword("");
      setConfirm("");
      setReason("");
      router.push("/");
    } catch (ex) {
      setErr(ex instanceof ApiError ? ex.message : "Could not delete account.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-10 rounded-xl border border-error/40 bg-error/10 p-6 text-forest" aria-labelledby="danger-heading">
      <h2 id="danger-heading" className="font-semibold text-error">
        Delete account (irreversible)
      </h2>
      <p className="mt-2 text-body-sm">
        Removes personal identifiable information while preserving order history snapshots for compliance.
      </p>
      <form className="mt-6 space-y-4" onSubmit={(e) => void submit(e)} aria-label="Delete account">
        <Input label="Type DELETE MY ACCOUNT" name="phrase" autoComplete="off" value={confirm} onChange={(ev) => setConfirm(ev.target.value)} required />
        <Input label="Reason (optional)" name="why" value={reason} onChange={(ev) => setReason(ev.target.value)} />
        <Input label="Current password" name="pw" type="password" autoComplete="current-password" value={password} onChange={(ev) => setPassword(ev.target.value)} required />
        {err ? (
          <p className="text-body-sm text-error" role="alert">
            {err}
          </p>
        ) : null}
        {msg ? (
          <p className="text-body-sm text-success" role="status">
            {msg}
          </p>
        ) : null}
        <Button
          type="submit"
          variant="secondary"
          className="border-error text-error hover:bg-error/10"
          disabled={busy || confirm.trim() !== "DELETE MY ACCOUNT"}
        >
          {busy ? "Deleting…" : "Delete my account permanently"}
        </Button>
      </form>
    </section>
  );
}
