"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { adminPrimaryNav } from "@/lib/admin-nav";
import { cn } from "@/lib/utils";

/**
 * Primary admin navigation (desktop sidebar).
 */
export function AdminSidebar() {
  const pathname = usePathname();
  return (
    <aside
      className="hidden w-56 shrink-0 flex-col border-r border-line bg-paper md:flex"
      aria-label="Admin navigation"
    >
      <div className="border-b border-line px-4 py-5">
        <Link href="/admin" className="font-display text-lg font-semibold text-forest">
          DiteUp
        </Link>
        <p className="mt-1 font-mono text-eyebrow text-ink-muted">Admin</p>
      </div>
      <nav className="flex flex-1 flex-col gap-0.5 p-3">
        {adminPrimaryNav.map((item) => {
          const active = pathname === item.href || (item.href !== "/admin" && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-lg px-3 py-2.5 text-body-sm font-medium transition-colors",
                active
                  ? "bg-beige text-forest shadow-sm"
                  : "text-ink-soft hover:bg-cream hover:text-forest",
              )}
            >
              {item.label}
            </Link>
          );
        })}
      </nav>
      <div className="border-t border-line p-3">
        <Link
          href="/"
          className="block rounded-lg px-3 py-2 text-body-sm font-medium text-gold-deep hover:bg-cream"
        >
          ← Storefront
        </Link>
      </div>
    </aside>
  );
}
