import Image from "next/image";
import Link from "next/link";
import { HeaderToolbar } from "@/components/layout/HeaderToolbar";

const navLinks = [
  { href: "/", label: "Home" },
  { href: "/#about", label: "About Us" },
  { href: "/#ingredients", label: "Ingredients" },
  { href: "/#benefits", label: "Benefits" },
  { href: "/#reviews", label: "Reviews" },
  { href: "/#faq", label: "FAQ" },
];

export type SiteHeaderProps = {
  variant?: "default" | "compact";
};

/**
 * Marketing header: promo bar, logo, desktop nav, icon placeholders for search / account / cart.
 */
export function SiteHeader({ variant = "default" }: SiteHeaderProps) {
  const isCompact = variant === "compact";
  return (
    <header className="sticky top-0 z-50">
      <p className="bg-cream py-2 text-center text-body-sm text-ink-soft border-b border-line">
        FREE SHIPPING on orders above ₹499
      </p>
      <div className="border-b border-line/80 bg-cream/90 backdrop-blur-md">
        <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-3 px-5 py-3 md:px-8 lg:px-12">
          <Link
            href="/"
            className="relative h-9 w-28 shrink-0 md:h-10 md:w-32"
            aria-label="DiteUp home"
          >
            <Image
              src="/assets/logos/diteup-logo.svg"
              alt=""
              fill
              className="object-contain object-left"
              priority
            />
          </Link>

          {!isCompact && (
            <nav
              className="hidden flex-1 justify-center gap-6 lg:flex"
              aria-label="Primary"
            >
              {navLinks.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  className="text-body-sm font-medium text-ink transition-colors hover:text-forest"
                >
                  {l.label}
                </Link>
              ))}
            </nav>
          )}

          <div className="flex items-center gap-1 sm:gap-2">
            <HeaderToolbar />
          </div>
        </div>
      </div>
    </header>
  );
}
