"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

/**
 * Admin login — POSTs through `/v1` rewrite so `dt_access` cookie is set on the app origin.
 */
export function AdminLoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const raw = searchParams.get("next") ?? "/admin";
  const next =
    raw.startsWith("/admin") && !raw.includes("://") && !raw.includes("//") ? raw : "/admin";
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
      const data = (await res.json().catch(() => ({}))) as { message?: string; user?: { role?: string } };
      if (!res.ok) {
        setError(data.message ?? "Login failed");
        setLoading(false);
        return;
      }
      if (data.user?.role !== "ADMIN") {
        setError("This account is not an admin.");
        setLoading(false);
        await fetch("/v1/auth/logout", { method: "POST", credentials: "include" }).catch(() => {});
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
    <div className="flex min-h-screen flex-col items-center justify-center bg-paper px-4 py-12">
      <div className="w-full max-w-[420px] rounded-2xl border border-line bg-cream p-8 shadow-md">
        <h1 className="font-display text-display-md font-semibold text-forest">Admin sign in</h1>
        <p className="mt-2 text-body-sm text-ink-muted">
          Uses the same credentials as your ADMIN user. Cookies are set via the Next.js{" "}
          <code className="font-mono text-xs">/v1</code> proxy.
        </p>
        <form className="mt-8 space-y-4" onSubmit={onSubmit}>
          <Input name="email" label="Email" type="email" autoComplete="email" required />
          <Input name="password" label="Password" type="password" autoComplete="current-password" required />
          {error ? (
            <p className="text-body-sm text-error" role="alert">
              {error}
            </p>
          ) : null}
          <Button type="submit" variant="primaryForest" size="lg" className="w-full" disabled={loading}>
            {loading ? "Signing in…" : "Sign in"}
          </Button>
        </form>
        <p className="mt-6 text-center text-body-sm">
          <Link href="/" className="text-gold-deep underline">
            Back to storefront
          </Link>
        </p>
      </div>
    </div>
  );
}
