"use client";

import Image from "next/image";
import Link from "next/link";
import { useCallback } from "react";
import { useCartState } from "@/components/cart/CartStateProvider";
import { useToast } from "@/components/ui/ToastProvider";

export type FlowHeaderProps = {
  backHref?: string;
  showSearch?: boolean;
  /** Product-style header: share + cart on the right. */
  showShare?: boolean;
};

/** Opens native share sheet or copies the current URL to the clipboard. */
async function shareOrCopyPageUrl(showToast: (message: string) => void) {
  const url = typeof window !== "undefined" ? window.location.href : "";
  if (!url) return;
  try {
    if (navigator.share) {
      await navigator.share({ url, title: document.title });
      return;
    }
    await navigator.clipboard.writeText(url);
    showToast("Link copied");
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.toLowerCase().includes("abort")) return;
    console.error("Share failed", err);
    try {
      await navigator.clipboard.writeText(url);
      showToast("Link copied");
    } catch (clipErr) {
      console.error("Clipboard fallback failed", clipErr);
    }
  }
}

/**
 * Thin left chevron for the back control (matches product flow mockups).
 * @param props - Standard SVG icon props forwarded to the root element.
 */
function FlowHeaderBackIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.85}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <path d="M15 5.5 8.5 12 15 18.5" />
    </svg>
  );
}

/**
 * Share / export glyph (square with arrow exiting upward).
 * @param props - Standard SVG icon props forwarded to the root element.
 */
function FlowHeaderShareIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <path
        d="M12 4v11"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
      />
      <path
        d="m9 7 3-3 3 3"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <rect
        x={4.75}
        y={10.75}
        width={14.5}
        height={10.5}
        rx={2.25}
        stroke="currentColor"
        strokeWidth={1.75}
      />
    </svg>
  );
}

/**
 * Search magnifying glass for order tracking and similar flows.
 * @param props - Standard SVG icon props forwarded to the root element.
 */
function FlowHeaderSearchIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <circle cx={11} cy={11} r={6.75} stroke="currentColor" strokeWidth={1.75} />
      <path d="m16 16 4.75 5" stroke="currentColor" strokeWidth={1.75} strokeLinecap="round" />
    </svg>
  );
}

/**
 * Shopping bag with optional center accent dot (badge sits outside in parent).
 * @param props - Standard SVG icon props forwarded to the root element.
 */
function FlowHeaderBagIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden {...props}>
      <path
        d="M8.75 10V8a3.25 3.25 0 0 1 6.5 0v2"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinecap="round"
      />
      <path
        d="M6 9h12l-.95 11.07a1 1 0 0 1-.99.93H7.94a1 1 0 0 1-.99-.93L6 9z"
        stroke="currentColor"
        strokeWidth={1.75}
        strokeLinejoin="round"
      />
      <circle cx={12} cy={14.5} r={1.1} fill="currentColor" className="text-gold" />
    </svg>
  );
}

/**
 * Compact header for cart / checkout / PDP / order flows (back + centered logo + actions).
 */
export function FlowHeader({ backHref = "/", showSearch = false, showShare = false }: FlowHeaderProps) {
  const { lines } = useCartState();
  const { showToast } = useToast();
  const cartCount = lines.reduce((sum, line) => sum + line.quantity, 0);

  const onShare = useCallback(() => {
    void shareOrCopyPageUrl(showToast);
  }, [showToast]);

  const iconClass = "size-[22px] text-ink";

  return (
    <header className="sticky top-0 z-50 border-b border-line bg-cream/95 backdrop-blur-md">
      <div className="mx-auto grid max-w-[1320px] grid-cols-[1fr_auto_1fr] items-center gap-3 px-4 py-3 md:px-8">
        <div className="flex min-w-0 justify-start">
          <Link
            href={backHref}
            className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-ink transition-colors hover:bg-beige/80 hover:text-forest"
            aria-label="Back"
          >
            <FlowHeaderBackIcon className={iconClass} />
          </Link>
        </div>

        <div className="flex min-w-0 justify-center px-1">
          <Link
            href="/"
            className="relative block h-9 w-[min(220px,58vw)] shrink-0 sm:h-10 sm:w-[min(260px,42vw)]"
            aria-label="Dite Up home"
          >
            <Image
              src="/assets/logos/logo_light.png"
              alt="Dite Up"
              fill
              className="object-contain object-center"
              sizes="(max-width: 768px) 58vw, 260px"
              priority
            />
          </Link>
        </div>

        <div className="flex min-w-0 items-center justify-end gap-0.5 sm:gap-1">
          {showShare ? (
            <button
              type="button"
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-ink transition-colors hover:bg-beige/80 hover:text-forest"
              aria-label="Share"
              onClick={onShare}
            >
              <FlowHeaderShareIcon className={iconClass} />
            </button>
          ) : null}
          {showSearch ? (
            <button
              type="button"
              className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-ink transition-colors hover:bg-beige/80 hover:text-forest"
              aria-label="Search"
            >
              <FlowHeaderSearchIcon className={iconClass} />
            </button>
          ) : (
            <Link
              href="/cart"
              className="relative inline-flex size-11 shrink-0 items-center justify-center rounded-full text-ink transition-colors hover:bg-beige/80 hover:text-forest"
              aria-label={cartCount > 0 ? `Cart, ${cartCount} items` : "Cart"}
            >
              <FlowHeaderBagIcon className={iconClass} />
              {cartCount > 0 ? (
                <span className="absolute right-1 top-1 min-w-[18px] rounded-full bg-gold px-1 text-center text-[10px] font-semibold text-forest">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              ) : null}
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
