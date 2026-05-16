"use client";

import Link from "next/link";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ApiError, clientApiJson } from "@/lib/client-api";

type ForgotResponse = { message?: string };

/**
 * Request password reset OTP — `POST /v1/auth/forgot-password`.
 */
export function ForgotPasswordClient() {
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "").trim().toLowerCase();
    try {
      await clientApiJson<ForgotResponse>("/v1/auth/forgot-password", {
        method: "POST",
        json: { email },
      });
      setDone(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Request failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      {done ? (
        <p className="mt-6 text-body-sm text-forest" role="status">
          If an account exists for that email, we sent a 6-digit code. Check your inbox and use it on{" "}
          <Link href="/reset-password" className="font-semibold text-gold-deep underline">
            Reset password
          </Link>
          .
        </p>
      ) : (
        <form className="mt-6 space-y-4" aria-label="Forgot password" onSubmit={onSubmit}>
          <Input
            name="email"
            label="Email"
            type="email"
            autoComplete="email"
            required
            aria-required="true"
          />
          {error ? (
            <p className="text-body-sm text-error" role="alert">
              {error}
            </p>
          ) : null}
          <Button type="submit" variant="primaryGold" size="lg" className="w-full" disabled={busy}>
            {busy ? "Sending…" : "Send OTP"}
          </Button>
        </form>
      )}
      <Link href="/login" className="mt-6 block text-center text-body-sm text-gold-deep underline">
        Back to login
      </Link>
    </>
  );
}
