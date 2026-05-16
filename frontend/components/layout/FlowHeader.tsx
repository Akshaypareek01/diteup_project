import Image from "next/image";
import Link from "next/link";
import { IconPlaceholder } from "@/components/placeholders/IconPlaceholder";

export type FlowHeaderProps = {
  backHref?: string;
  showSearch?: boolean;
};

/**
 * Compact header for cart / checkout / PDP / order flows (mockup: back + logo + action).
 */
export function FlowHeader({ backHref = "/", showSearch = false }: FlowHeaderProps) {
  return (
    <header className="sticky top-0 z-50 border-b border-line bg-cream/95 backdrop-blur-md">
      <div className="mx-auto flex max-w-[1320px] items-center justify-between gap-3 px-4 py-3 md:px-8">
        <Link
          href={backHref}
          className="inline-flex size-11 items-center justify-center rounded-full hover:bg-beige/80"
          aria-label="Back"
        >
          <IconPlaceholder label="Back arrow icon" size="md" />
        </Link>
        <Link href="/" className="relative h-8 w-28" aria-label="DiteUp home">
          <Image
            src="/assets/logos/diteup-logo.svg"
            alt=""
            fill
            className="object-contain"
            priority
          />
        </Link>
        <div className="flex items-center gap-1">
          {showSearch ? (
            <button
              type="button"
              className="inline-flex size-11 items-center justify-center rounded-full hover:bg-beige/80"
              aria-label="Search"
            >
              <IconPlaceholder label="Search icon" size="md" />
            </button>
          ) : (
            <Link
              href="/cart"
              className="relative inline-flex size-11 items-center justify-center rounded-full hover:bg-beige/80"
              aria-label="Cart"
            >
              <IconPlaceholder label="Cart icon" size="md" />
              <span className="absolute right-1 top-1 min-w-[18px] rounded-full bg-gold px-1 text-center text-[10px] font-semibold text-forest">
                0
              </span>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
