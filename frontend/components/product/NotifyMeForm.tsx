"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { ApiError, clientApiJson } from "@/lib/client-api";

export type NotifyMeFormProps = {
  variantId: string;
  productLabel: string;
};

/**
 * Back-in-stock / launch alerts via `POST /v1/notify-me`.
 */
export function NotifyMeForm({ variantId, productLabel }: NotifyMeFormProps) {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setMsg(null);
    setBusy(true);
    try {
      const body = await clientApiJson<{ message?: string }>("/v1/notify-me", {
        method: "POST",
        json: {
          variantId,
          email: email.trim().toLowerCase(),
          phone: phone.trim() || undefined,
        },
      });
      setMsg(body.message ?? "You're subscribed.");
      setPhone("");
    } catch (error) {
      setErr(error instanceof ApiError ? error.message : "Could not save your notification.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <section className="mt-8 rounded-xl border border-warning/40 bg-warning/10 p-5" aria-labelledby="notify-heading">
      <h2 id="notify-heading" className="font-semibold text-forest">
        Get notified — {productLabel}
      </h2>
      <p className="mt-2 text-body-sm text-ink-muted">{"We'll email you when this variant is ready to ship again."}</p>
      <form className="mt-4 space-y-3" onSubmit={submit} aria-label="Notify when back in stock">
        <Input
          label="Email"
          name="notify-email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(ev) => setEmail(ev.target.value)}
          required
        />
        <Input
          label="Phone (optional)"
          name="notify-phone"
          type="tel"
          autoComplete="tel"
          value={phone}
          onChange={(ev) => setPhone(ev.target.value)}
        />
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
        <Button type="submit" variant="primaryForest" disabled={busy || !email.trim()}>
          {busy ? "Saving…" : "Notify me"}
        </Button>
      </form>
    </section>
  );
}
