"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { useCartDrawer } from "@/components/cart/CartDrawerProvider";
import { useCartState } from "@/components/cart/CartStateProvider";
import { MobileNavDrawer } from "@/components/layout/MobileNavDrawer";
import { SiteNavHashLink } from "@/components/layout/SiteNavHashLink";
import type { SiteNavLink } from "@/components/layout/site-nav-links";

/** Magnifying glass outline — inherits `currentColor`. */
function IconSearch({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width={22} height={22} fill="none" aria-hidden>
      <circle cx={11} cy={11} r={7} stroke="currentColor" strokeWidth={1.5} />
      <path d="M20 20l-4-4" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  );
}

/** User silhouette outline — inherits `currentColor`. */
function IconUser({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width={22} height={22} fill="none" aria-hidden>
      <circle cx={12} cy={8} r={3.5} stroke="currentColor" strokeWidth={1.5} />
      <path
        d="M5.5 20.5v-1c0-3 2.5-5.5 6.5-5.5s6.5 2.5 6.5 5.5v1"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Shopping bag outline — inherits `currentColor`. */
function IconBag({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width={22} height={22} fill="none" aria-hidden>
      <path
        d="M8.5 9V7a3.5 3.5 0 017 0v2"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <path
        d="M6 9h12l-1 12H7L6 9z"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Hamburger menu — inherits `currentColor`. */
function IconMenu({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width={22} height={22} fill="none" aria-hidden>
      <path d="M5 7h14M5 12h14M5 17h14" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  );
}

export type SiteHeaderBarProps = {
  /** When true, omits the centered desktop nav (e.g. compact marketing pages). */
  isCompact?: boolean;
  /** Resolved on the server (featured PDP or `NEXT_PUBLIC_SHOP_PRODUCT_SLUG`). */
  navLinks: SiteNavLink[];
};

/**
 * Cream nav row: on small viewports — menu | centered logo | cart; on `lg+` — logo left, links center, search/account/cart right.
 */
export function SiteHeaderBar({ isCompact = false, navLinks }: SiteHeaderBarProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const { openCart } = useCartDrawer();
  const { lines } = useCartState();

  const cartQty = useMemo(() => lines.reduce((sum, line) => sum + line.quantity, 0), [lines]);
  const cartBadge = cartQty > 99 ? "99+" : cartQty > 0 ? String(cartQty) : null;

  return (
    <>
      <div className="border-b border-line bg-cream">
        <div className="mx-auto max-w-[1320px] px-4 py-3 md:px-8 lg:gap-8 lg:px-12">
          {/* Mobile / small tablets: three-column storefront rail */}
          <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 lg:hidden">
            <div className="flex justify-start">
              <button
                type="button"
                className="inline-flex size-10 items-center justify-center rounded-md text-ink transition-colors hover:bg-beige/90"
                aria-label="Open menu"
                aria-expanded={menuOpen}
                onClick={() => setMenuOpen(true)}
              >
                <IconMenu />
              </button>
            </div>
            <HeaderLogo className="relative h-11 w-[9rem] justify-self-center sm:h-12 sm:w-[10rem]" />
            <div className="flex justify-end gap-1">
              {/* <HeroBannerArtworkToggle /> */}
              <button
                type="button"
                className="relative inline-flex size-10 items-center justify-center rounded-md text-ink transition-colors hover:bg-beige/90"
                aria-label={cartQty > 0 ? `Open cart, ${cartQty} items` : "Open cart"}
                onClick={openCart}
              >
                <IconBag />
                {cartBadge !== null ? (
                  <span className="absolute right-1 top-1 flex min-h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-error px-1 text-[10px] font-semibold leading-none text-white">
                    {cartBadge}
                  </span>
                ) : null}
              </button>
            </div>
          </div>

          {/* Desktop */}
          <div className="hidden items-center justify-between gap-4 lg:flex">
            <HeaderLogo className="relative h-11 w-[9.5rem] shrink-0 sm:h-12 sm:w-[10.5rem]" />
            {!isCompact && (
              <nav
                className="flex flex-1 justify-center gap-5 xl:gap-9"
                aria-label="Primary"
              >
                {navLinks.map((l) => (
                  <SiteNavHashLink
                    key={`${l.label}-${l.href}`}
                    nav={l}
                    className="text-[0.8125rem] font-semibold uppercase tracking-[0.08em] text-ink transition-colors hover:text-forest"
                  />
                ))}
              </nav>
            )}
            <div className="flex items-center gap-0.5 sm:gap-1">
              {/* <HeroBannerArtworkToggle /> */}
              <button
                type="button"
                className="inline-flex size-10 items-center justify-center rounded-md text-ink transition-colors hover:bg-beige/90"
                aria-label="Search products"
              >
                <IconSearch />
              </button>
              <Link
                href="/account"
                className="inline-flex size-10 items-center justify-center rounded-md text-ink transition-colors hover:bg-beige/90"
                aria-label="Account"
              >
                <IconUser />
              </Link>
              <button
                type="button"
                className="relative inline-flex size-10 items-center justify-center rounded-md text-ink transition-colors hover:bg-beige/90"
                aria-label={cartQty > 0 ? `Open cart, ${cartQty} items` : "Open cart"}
                onClick={openCart}
              >
                <IconBag />
                {cartBadge !== null ? (
                  <span className="absolute right-1 top-1 flex min-h-[1.125rem] min-w-[1.125rem] items-center justify-center rounded-full bg-error px-1 text-[10px] font-semibold leading-none text-white">
                    {cartBadge}
                  </span>
                ) : null}
              </button>
            </div>
          </div>
        </div>
      </div>
      <MobileNavDrawer navLinks={navLinks} open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}

type HeaderLogoProps = {
  className: string;
};

/**
 * Brand mark linking home — `className` should set footprint (`relative`, height/width).
 */
function HeaderLogo({ className }: HeaderLogoProps) {
  return (
    <Link href="/" className={`block shrink-0 ${className}`} aria-label="DiteUp home">
      <Image
        src="/assets/logos/logo_light.png"
        alt=""
        fill
        className="object-contain object-center lg:object-left"
        priority
      />
    </Link>
  );
}
