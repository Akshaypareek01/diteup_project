"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";

const SUPPORT_EMAIL = "support@diteup.com";

/**
 * Opens the user’s mail client — no public contact API in the backend yet.
 */
export function ContactMailForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const subject = encodeURIComponent(`DiteUp contact from ${name || "visitor"}`);
    const lines = [`From: ${name}`, `Reply-to: ${email}`, "", message].filter(Boolean).join("\n");
    const mailto = `mailto:${SUPPORT_EMAIL}?subject=${subject}&body=${encodeURIComponent(lines)}`;
    window.location.href = mailto;
  }

  return (
    <form className="mt-8 space-y-4" aria-label="Contact form" onSubmit={submit}>
      <Input label="Name" name="name" value={name} onChange={(ev) => setName(ev.target.value)} />
      <Input label="Your email" name="email" type="email" value={email} onChange={(ev) => setEmail(ev.target.value)} />
      <div>
        <label className="mb-1.5 block font-mono text-eyebrow font-semibold uppercase text-ink-muted" htmlFor="msg">
          Message
        </label>
        <textarea
          id="msg"
          name="message"
          required
          value={message}
          onChange={(ev) => setMessage(ev.target.value)}
          className="min-h-[120px] w-full rounded-lg border border-line bg-paper p-3 text-body outline-none focus:border-forest"
          aria-required="true"
        />
      </div>
      <p className="text-body-sm text-ink-muted">
        This opens your email app to reach <span className="font-mono">{SUPPORT_EMAIL}</span>.
      </p>
      <Button type="submit" variant="primaryGold" size="lg" className="w-full">
        Open in email
      </Button>
    </form>
  );
}
