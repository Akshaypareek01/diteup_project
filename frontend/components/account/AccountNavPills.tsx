"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export type AccountNavItem = {
  href: string;
  label: string;
};

type AccountNavPillsProps = {
  links: readonly AccountNavItem[];
};

/**
 * Horizontal scroll on small viewports; wraps on larger screens. Highlights the current account section.
 */
export function AccountNavPills({ links }: AccountNavPillsProps) {
  const pathname = usePathname() ?? "";

  /**
   * Whether `href` should render as the active tab for the current pathname.
   */
  function isActiveHref(href: string): boolean {
    if (href === "/account") {
      return pathname === "/account";
    }
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  return (
    <nav aria-label="Account sections" className="min-w-0 w-full lg:w-auto">
      <ul className="flex snap-x snap-mandatory gap-2 overflow-x-auto overscroll-x-contain pb-1 [scrollbar-width:none] sm:flex-wrap sm:overflow-x-visible sm:pb-0 sm:pl-0 [&::-webkit-scrollbar]:hidden">
        {links.map((l) => {
          const active = isActiveHref(l.href);
          return (
            <li key={l.href} className="snap-start shrink-0">
              <Link
                href={l.href}
                aria-current={active ? "page" : undefined}
                className={
                  active
                    ? "inline-flex rounded-full border-2 border-forest bg-cream px-3.5 py-2 text-body-sm font-semibold text-forest sm:px-4"
                    : "inline-flex rounded-full border border-line bg-cream px-3.5 py-2 text-body-sm font-medium text-forest transition-colors hover:border-forest sm:px-4"
                }
              >
                {l.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
