"use client";

import { AnimatePresence, motion } from "framer-motion";
import Link from "next/link";
import { slideInFromRight } from "@/lib/motion";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/#about", label: "About Us" },
  { href: "/#ingredients", label: "Ingredients" },
  { href: "/#benefits", label: "Benefits" },
  { href: "/#reviews", label: "Reviews" },
  { href: "/#faq", label: "FAQ" },
];

export type MobileNavDrawerProps = {
  open: boolean;
  onClose: () => void;
};

/**
 * Full-height nav drawer from the right — DESIGN-SYSTEM §7.9.
 */
export function MobileNavDrawer({ open, onClose }: MobileNavDrawerProps) {
  return (
    <AnimatePresence>
      {open ? (
        <>
          <motion.button
            type="button"
            aria-label="Close menu"
            className="fixed inset-0 z-[70] bg-forest/40 backdrop-blur-sm lg:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <motion.nav
            aria-label="Mobile primary"
            className="fixed inset-y-0 right-0 z-[80] flex w-[min(100vw-3rem,320px)] flex-col bg-cream shadow-lg lg:hidden"
            variants={slideInFromRight}
            initial="hidden"
            animate="show"
            exit="exit"
          >
            <div className="flex justify-end border-b border-line px-4 py-3">
              <button
                type="button"
                className="rounded-full px-3 py-2 text-body-sm font-medium text-ink-muted"
                onClick={onClose}
              >
                Close
              </button>
            </div>
            <ul className="flex flex-1 flex-col gap-1 p-4">
              {navLinks.map((item, i) => (
                <motion.li
                  key={item.href}
                  initial={{ opacity: 0, x: 16 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * i }}
                >
                  <Link
                    href={item.href}
                    className="block rounded-lg px-4 py-3 text-body font-medium text-forest hover:bg-beige/80"
                    onClick={onClose}
                  >
                    {item.label}
                  </Link>
                </motion.li>
              ))}
            </ul>
          </motion.nav>
        </>
      ) : null}
    </AnimatePresence>
  );
}
