"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ApiError, clientApiJson } from "@/lib/client-api";

/**
 * Progressive email migration — mirrors backend `phase` discriminator (`POST /v1/me/email/change`).
 */
export function EmailChangeFlow({ initialEmail }: { initialEmail: string }) {
  const router = useRouter();
  const [phase, setPhase] = useState<"request" | "verify_new" | "verify_old">("request");
  const [newEmail, setNewEmail] = useState("");
  const [pw, setPw] = useState("");
  const [code, setCode] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submitPhase(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setStatus(null);
    setBusy(true);
    try {
      if (phase === "request") {
        const body = await clientApiJson<{ phase?: string; message?: string }>(`/v1/me/email/change`, {
          method: "POST",
          json: {
            phase: "request",
            newEmail: newEmail.trim().toLowerCase(),
            currentPassword: pw,
          },
        });
        setPw("");
        if (body.phase === "verify_new") {
          setPhase("verify_new");
          setCode("");
          setStatus(body.message ?? "Check your inbox.");
        }
        return;
      }
      if (phase === "verify_new") {
        const body = await clientApiJson<{ phase?: string; message?: string }>(`/v1/me/email/change`, {
          method: "POST",
          json: {
            phase: "verify_new",
            newEmail: newEmail.trim().toLowerCase(),
            code: code.trim(),
          },
        });
        setCode("");
        if (body.phase === "verify_old") {
          setPhase("verify_old");
          setStatus(body.message ?? "Almost done.");
        }
        return;
      }
      const body = await clientApiJson<{ phase?: string; message?: string; email?: string }>(`/v1/me/email/change`, {
        method: "POST",
        json: {
          phase: "verify_old",
          newEmail: newEmail.trim().toLowerCase(),
          code: code.trim(),
        },
      });
      setStatus(body.message ?? "Email updated.");
      setPhase("request");
      setNewEmail("");
      router.refresh();
      router.push("/login?reason=email-changed");
    } catch (ex) {
      setErr(ex instanceof ApiError ? ex.message : "Could not proceed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-10 max-w-lg rounded-xl border border-line bg-paper p-6" aria-labelledby="email-change-heading">
      <h2 id="email-change-heading" className="font-semibold text-forest">
        Change login email
      </h2>
      <p className="mt-2 text-body-sm text-ink-muted">
        Current email: <span className="font-mono text-forest">{initialEmail}</span>
      </p>
      <form className="mt-6 space-y-4" onSubmit={(e) => void submitPhase(e)} aria-label="Email change wizard">
        {phase === "request" ? (
          <>
            <Input label="New email" name="newEmail" type="email" value={newEmail} onChange={(ev) => setNewEmail(ev.target.value)} required />
            <Input label="Current password" name="curPw" type="password" autoComplete="current-password" value={pw} onChange={(ev) => setPw(ev.target.value)} required />
          </>
        ) : (
          <>
            <p className="text-body-sm text-ink-soft">New email locked to {newEmail} for this session.</p>
            <Input
              label={phase === "verify_new" ? "Code → new inbox" : "Code → old inbox"}
              name="otp"
              inputMode="numeric"
              maxLength={6}
              autoComplete="one-time-code"
              value={code}
              onChange={(ev) => setCode(ev.target.value)}
              required
            />
          </>
        )}
        {err ? (
          <p className="text-body-sm text-error" role="alert">
            {err}
          </p>
        ) : null}
        {status ? (
          <p className="text-body-sm text-success" role="status">
            {status}
          </p>
        ) : null}
        <Button type="submit" variant="primaryForest" disabled={busy}>
          {busy ? "Working…" : phase === "request" ? "Send codes" : "Verify code"}
        </Button>
      </form>
    </section>
  );
}
