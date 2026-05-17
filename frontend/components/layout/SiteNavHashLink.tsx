"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import type { MouseEvent } from "react";

import type { SiteNavLink } from "@/components/layout/site-nav-links";

export type SiteNavHashLinkProps = {
  nav: SiteNavLink;
  className?: string;
  /** Runs after resolving in-page navigation (e.g. close mobile drawer). */
  onNavigate?: () => void;
};

/**
 * Storefront nav link: ensures `/#section` hops scroll on the home page where Next `<Link>`
 * alone may no-op while the route pathname is unchanged.
 */
export function SiteNavHashLink({ nav, className, onNavigate }: SiteNavHashLinkProps) {
  const pathname = usePathname();

  /**
   * Intercepts duplicate-route clicks so anchored sections scroll and optional UI (drawer)
   * can close reliably.
   */
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (pathname !== "/") return;

    if (nav.href === "/") {
      event.preventDefault();
      window.scrollTo({ top: 0, behavior: "smooth" });
      void window.history.replaceState(null, "", "/");
      onNavigate?.();
      return;
    }

    if (!nav.href.startsWith("/#")) return;
    const id = nav.href.slice(2);
    if (!id) return;
    event.preventDefault();
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
      void window.history.replaceState(null, "", `/#${id}`);
    }
    onNavigate?.();
  }

  return (
    <Link href={nav.href} className={className} onClick={handleClick}>
      {nav.label}
    </Link>
  );
}
