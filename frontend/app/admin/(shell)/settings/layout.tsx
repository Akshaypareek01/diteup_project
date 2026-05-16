import Link from "next/link";
import type { ReactNode } from "react";
import { settingsSections } from "@/lib/admin-nav";
import { cn } from "@/lib/utils";

export default function AdminSettingsLayout({ children }: { children: ReactNode }) {
  return (
    <div className="space-y-8">
      <div>
        <h1 className="font-display text-display-md font-semibold text-forest">Settings</h1>
        <p className="mt-1 text-body text-ink-soft">
          PRD §7.10 — product-level overrides win over these defaults.
        </p>
      </div>
      <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
        <nav className="space-y-1 lg:sticky lg:top-20 lg:self-start" aria-label="Settings sections">
          {settingsSections.map((s) => (
            <Link
              key={s.slug}
              href={`/admin/settings/${s.slug}`}
              className={cn(
                "block rounded-lg px-3 py-2 text-body-sm font-medium text-ink-soft hover:bg-paper hover:text-forest",
              )}
            >
              {s.label}
            </Link>
          ))}
        </nav>
        <div className="min-w-0">{children}</div>
      </div>
    </div>
  );
}
