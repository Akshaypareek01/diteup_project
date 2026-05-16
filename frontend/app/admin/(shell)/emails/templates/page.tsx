import Link from "next/link";
import { Card } from "@/components/ui/Card";

const TEMPLATES = ["order_confirmed", "order_shipped", "welcome", "otp_verify"] as const;

/**
 * Transactional templates are defined in backend code — no admin JSON API yet.
 */
export default function AdminEmailTemplatesPage() {
  return (
    <div className="space-y-6">
      <h1 className="font-display text-display-md font-semibold text-forest">Transactional templates</h1>
      <p className="text-body-sm text-ink-muted">
        Template HTML lives in the API repo (e.g. <code className="font-mono text-xs">backend/src/emails</code>). There is
        no <code className="font-mono text-xs">PATCH</code> route for editing them from this UI yet.
      </p>
      <div className="grid gap-3 sm:grid-cols-2">
        {TEMPLATES.map((t) => (
          <Card key={t}>
            <h2 className="font-mono text-sm font-semibold text-forest">{t}</h2>
            <p className="mt-2 text-body-sm text-ink-muted">Rendered server-side when transactional email sends.</p>
          </Card>
        ))}
      </div>
      <Link href="/admin/emails" className="text-body-sm text-gold-deep hover:underline">
        ← Emails hub
      </Link>
    </div>
  );
}
