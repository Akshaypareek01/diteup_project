"use client";

import Link from "next/link";
import type { AdminUser } from "@/lib/admin-session";
import { adminPrimaryNav } from "@/lib/admin-nav";

export type AdminTopbarProps = {
  user: AdminUser;
};

/**
 * Sticky top bar with mobile nav jump and logout.
 */
export function AdminTopbar({ user }: AdminTopbarProps) {
  return (
    <header className="sticky top-0 z-40 flex h-14 shrink-0 items-center justify-between gap-3 border-b border-line bg-cream/95 px-4 backdrop-blur-md md:px-6">
      <div className="flex min-w-0 items-center gap-3">
        <label className="md:hidden">
          <span className="sr-only">Jump to section</span>
          <select
            className="h-10 max-w-[200px] rounded-lg border border-line bg-paper text-body-sm"
            onChange={(e) => {
              if (e.target.value) window.location.href = e.target.value;
            }}
            defaultValue=""
            aria-label="Jump to admin section"
          >
            <option value="" disabled>
              Menu…
            </option>
            {adminPrimaryNav.map((item) => (
              <option key={item.href} value={item.href}>
                {item.label}
              </option>
            ))}
          </select>
        </label>
        <p className="hidden truncate font-mono text-body-sm text-ink-muted md:block">
          Signed in as <span className="font-semibold text-forest">{user.email}</span>
        </p>
      </div>
      <div className="flex items-center gap-2">
        <Link
          href="/"
          className="hidden rounded-lg border border-line px-3 py-2 text-body-sm font-medium text-forest hover:bg-paper sm:inline-block"
        >
          View site
        </Link>
        <button
          type="button"
          className="rounded-lg bg-forest px-3 py-2 text-body-sm font-semibold text-cream hover:brightness-110"
          onClick={async () => {
            try {
              await fetch("/v1/auth/logout", { method: "POST", credentials: "include" });
            } catch {
              /* still redirect */
            }
            window.location.href = "/admin/login";
          }}
        >
          Log out
        </button>
      </div>
    </header>
  );
}
