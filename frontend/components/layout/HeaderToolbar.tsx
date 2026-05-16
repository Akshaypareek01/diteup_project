"use client";

import Link from "next/link";
import { useState } from "react";
import { useCartDrawer } from "@/components/cart/CartDrawerProvider";
import { MobileNavDrawer } from "@/components/layout/MobileNavDrawer";
import { IconPlaceholder } from "@/components/placeholders/IconPlaceholder";

/**
 * Header actions: mobile menu, search, account, cart (opens mini-cart).
 */
export function HeaderToolbar() {
  const [menuOpen, setMenuOpen] = useState(false);
  const { openCart } = useCartDrawer();

  return (
    <>
      <div className="flex items-center gap-1 sm:gap-2">
        <button
          type="button"
          className="inline-flex size-11 items-center justify-center rounded-full text-forest hover:bg-beige/80 lg:hidden"
          aria-label="Open menu"
          aria-expanded={menuOpen}
          onClick={() => setMenuOpen(true)}
        >
          <IconPlaceholder label="Menu icon" size="md" />
        </button>
        <button
          type="button"
          className="hidden size-11 items-center justify-center rounded-full text-forest hover:bg-beige/80 lg:inline-flex"
          aria-label="Search"
        >
          <IconPlaceholder label="Search icon" size="md" />
        </button>
        <Link
          href="/account/profile"
          className="inline-flex size-11 items-center justify-center rounded-full text-forest hover:bg-beige/80"
          aria-label="Account"
        >
          <IconPlaceholder label="Account icon" size="md" />
        </Link>
        <button
          type="button"
          className="relative inline-flex size-11 items-center justify-center rounded-full text-forest hover:bg-beige/80"
          aria-label="Open cart"
          onClick={openCart}
        >
          <IconPlaceholder label="Cart icon" size="md" />
          <span className="absolute right-1 top-1 min-w-[18px] rounded-full bg-gold px-1 text-center text-[10px] font-semibold text-forest">
            0
          </span>
        </button>
      </div>
      <MobileNavDrawer open={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
