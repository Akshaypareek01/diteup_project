import Link from "next/link";

import { AccountNavPills, type AccountNavItem } from "@/components/account/AccountNavPills";

const accountLinks: readonly AccountNavItem[] = [
  { href: "/account", label: "Profile" },
  { href: "/account/orders", label: "Orders" },
  { href: "/account/addresses", label: "Addresses" },
  { href: "/account/reviews/new", label: "Write a review" },
];

type AccountAreaHeaderProps = {
  /** Resolved storefront target from {@link resolveShopNavHref}. */
  shopHref: string;
};

/**
 * Sticky account chrome: escape hatch back to the marketing site plus section pills.
 */
export function AccountAreaHeader({ shopHref }: AccountAreaHeaderProps) {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-paper/95 backdrop-blur-sm">
      <div className="mx-auto max-w-[1080px] px-4 py-3 sm:py-4">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between lg:gap-8">
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-center sm:gap-3">
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-body-sm font-semibold text-gold-deep underline-offset-4 hover:underline focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
            >
              <span aria-hidden className="inline-block text-forest">
                <svg viewBox="0 0 24 24" width={18} height={18} fill="none" className="shrink-0">
                  <path
                    d="M15 18l-6-6 6-6"
                    stroke="currentColor"
                    strokeWidth={1.75}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
              Back to site
            </Link>
            <span className="hidden h-4 w-px bg-line sm:block" aria-hidden />
            <Link
              href={shopHref}
              className="inline-flex items-center rounded-full border border-line bg-cream px-3.5 py-2 text-body-sm font-medium text-forest transition-colors hover:border-forest focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest sm:px-4"
            >
              Continue shopping
            </Link>
          </div>
          <div className="w-full min-w-0 lg:flex lg:max-w-[70%] lg:justify-end xl:max-w-[60%]">
            <AccountNavPills links={accountLinks} />
          </div>
        </div>
      </div>
    </header>
  );
}
