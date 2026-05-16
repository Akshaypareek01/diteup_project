"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ApiError, clientApiJson, pickApiMessage } from "@/lib/client-api";

/**
 * Complete reset with OTP + new password — `POST /v1/auth/reset-password` (sets session cookies).
 */
export function ResetPasswordClient() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "").trim().toLowerCase();
    const code = String(fd.get("code") ?? "").trim();
    const newPassword = String(fd.get("newPassword") ?? "");
    try {
      await clientApiJson("/v1/auth/reset-password", {
        method: "POST",
        json: { email, code, newPassword },
      });
      router.push("/account");
      router.refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : pickApiMessage(null, "Reset failed"));
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <form className="mt-6 space-y-4" aria-label="Reset password" onSubmit={onSubmit}>
        <Input name="email" label="Email" type="email" autoComplete="email" required aria-required="true" />
        <Input
          name="code"
          label="6-digit code"
          inputMode="numeric"
          autoComplete="one-time-code"
          pattern="\d{6}"
          maxLength={6}
          required
          aria-required="true"
        />
        <Input
          name="newPassword"
          label="New password"
          type="password"
          autoComplete="new-password"
          required
          aria-required="true"
          aria-describedby="pw-hint"
        />
        <p id="pw-hint" className="text-body-sm text-ink-muted">
          At least 8 characters, with one letter and one number.
        </p>
        {error ? (
          <p className="text-body-sm text-error" role="alert">
            {error}
          </p>
        ) : null}
        <Button type="submit" variant="primaryGold" size="lg" className="w-full" disabled={busy}>
          {busy ? "Saving…" : "Save new password"}
        </Button>
      </form>
      <p className="mt-4 text-center text-body-sm text-ink-muted">
        Need a new code?{" "}
        <Link href="/forgot-password" className="text-gold-deep underline">
          Forgot password
        </Link>
      </p>
      <Link href="/login" className="mt-4 block text-center text-body-sm text-gold-deep underline">
        Login
      </Link>
    </>
  );
}
