"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { pickApiMessage } from "@/lib/client-api";
import { pixelCompleteRegistration } from "@/lib/meta-pixel-events";

function SignupFlow() {
  const router = useRouter();
  const [phase, setPhase] = useState<"register" | "verify">("register");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const [loading, setLoading] = useState(false);
  useEffect(() => {
    if (cooldown <= 0) return;
    const t = window.setTimeout(() => setCooldown((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [cooldown]);

  async function register(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/v1/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password, marketingOptIn: false }),
      });
      let data: unknown = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }
      if (!res.ok) {
        setError(pickApiMessage(data, "Sign up failed"));
        return;
      }
      setPhase("verify");
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/v1/auth/verify-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, code }),
      });
      let data: unknown = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }
      if (!res.ok) {
        setError(pickApiMessage(data, "Verification failed"));
        return;
      }
      pixelCompleteRegistration();
      router.push("/account");
      router.refresh();
    } catch {
      setError("Network error");
    } finally {
      setLoading(false);
    }
  }

  async function resendOtpForVerify() {
    setError(null);
    try {
      const res = await fetch("/v1/auth/resend-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, purpose: "EMAIL_VERIFY" }),
      });
      let data: unknown = null;
      try {
        data = await res.json();
      } catch {
        data = null;
      }
      if (!res.ok) {
        setError(pickApiMessage(data, "Could not resend code"));
        return;
      }
      setCooldown(60);
    } catch {
      setError("Network error");
    }
  }

  if (phase === "verify") {
    return (
      <form className="mt-6 space-y-4" onSubmit={verify} aria-label="Verify email">
        <p className="text-body-sm text-ink-muted">Enter the 6-digit code sent to {email}.</p>
        <Input name="code" label="Code" inputMode="numeric" autoComplete="one-time-code" value={code} onChange={(ev) => setCode(ev.target.value)} required maxLength={6} />
        <button
          type="button"
          className="text-body-sm font-semibold text-gold-deep underline disabled:text-ink-muted"
          disabled={cooldown > 0 || loading}
          onClick={() => void resendOtpForVerify()}
        >
          {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend code"}
        </button>
        {error ? (
          <p className="text-body-sm text-error" role="alert">
            {error}
          </p>
        ) : null}
        <Button type="submit" variant="primaryGold" size="lg" className="w-full" disabled={loading}>
          {loading ? "Verifying…" : "Verify and continue"}
        </Button>
      </form>
    );
  }

  return (
    <form className="mt-6 space-y-4" onSubmit={register} aria-label="Sign up">
      <Input name="email" label="Email" type="email" autoComplete="email" value={email} onChange={(ev) => setEmail(ev.target.value)} required />
      <Input name="password" label="Password" type="password" autoComplete="new-password" value={password} onChange={(ev) => setPassword(ev.target.value)} required />
      {error ? (
        <p className="text-body-sm text-error" role="alert">
          {error}
        </p>
      ) : null}
      <Button type="submit" variant="primaryGold" size="lg" className="w-full" disabled={loading}>
        {loading ? "Sending code…" : "Create account"}
      </Button>
    </form>
  );
}

export function SignupPageClient() {
  return <SignupFlow />;
}
