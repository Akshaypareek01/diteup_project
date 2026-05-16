import Link from "next/link";
import { Card } from "@/components/ui/Card";

export default function AdminEmailsHubPage() {
  const links = [
    { href: "/admin/emails/templates", label: "Transactional templates", desc: "PRD §7.9 — merge tags, test send" },
    { href: "/admin/emails/broadcasts", label: "Broadcasts", desc: "Composer + segments + throttle" },
    { href: "/admin/emails/log", label: "Email log", desc: "Delivery + bounce drill-down" },
  ];
  return (
    <div className="space-y-6">
      <h1 className="font-display text-display-md font-semibold text-forest">Emails</h1>
      <div className="grid gap-4 md:grid-cols-3">
        {links.map((l) => (
          <Link key={l.href} href={l.href}>
            <Card className="h-full transition hover:shadow-md">
              <h2 className="font-semibold text-forest">{l.label}</h2>
              <p className="mt-2 text-body-sm text-ink-muted">{l.desc}</p>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
