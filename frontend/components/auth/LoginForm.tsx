"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { pickApiMessage } from "@/lib/client-api";

/**
 * Customer login — `POST /v1/auth/login` via same-origin `/v1` proxy.
 */
export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const raw = searchParams.get("next") ?? "/account";
  const next =
    raw.startsWith("/") && !raw.includes("://") && !raw.includes("//") ? raw : "/account";

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "");
    const password = String(fd.get("password") ?? "");
    try {
      const res = await fetch("/v1/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password, rememberMe: true }),
      });
      let data: unknown = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }
      if (!res.ok) {
        setError(pickApiMessage(data, "Login failed"));
        return;
      }
      router.push(next);
      router.refresh();
    } catch {
      setError("Network error — is the API running?");
    } finally {
      setLoading(false);
    }
  }

  return (
    <form className="mt-6 space-y-4" aria-label="Login" onSubmit={onSubmit}>
      <Input name="email" label="Email" type="email" autoComplete="email" required />
      <Input name="password" label="Password" type="password" autoComplete="current-password" required />
      {error ? (
        <p className="text-body-sm text-error" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" variant="primaryGold" size="lg" className="w-full" disabled={loading}>
        {loading ? "Signing in…" : "Continue"}
      </Button>
      <p className="text-body-sm text-ink-muted">
        <Link href="/forgot-password" className="text-gold-deep underline">
          Forgot password?
        </Link>
      </p>
      <p className="text-body-sm">
        New here?{" "}
        <Link href="/signup" className="font-semibold text-forest underline">
          Create account
        </Link>
      </p>
    </form>
  );
}
