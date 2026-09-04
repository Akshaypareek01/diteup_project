"use client";

import { SiteModeStrip } from "@/components/site-mode/SiteModeStrip";
import { useSiteMode } from "@/components/site-mode/SiteModeProvider";

/** Truck outline — inherits `currentColor`. */
function IconTruck({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <path
        d="M14 18V6a1 1 0 00-1-1H4a1 1 0 00-1 1v11a2 2 0 002 2h2"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 9h4l3 4v5h-3M14 18h5"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={7} cy={18} r={2} stroke="currentColor" strokeWidth={1.5} />
      <circle cx={17} cy={18} r={2} stroke="currentColor" strokeWidth={1.5} />
    </svg>
  );
}

/** Indian tricolor — saffron, white, green with a simplified Ashoka Chakra. */
function IconIndiaFlag({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width={18}
      height={12}
      viewBox="0 0 27 18"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect width={27} height={6} fill="#FF9933" />
      <rect y={6} width={27} height={6} fill="#FFFFFF" />
      <rect y={12} width={27} height={6} fill="#138808" />
      <circle
        cx={13.5}
        cy={9}
        r={2.4}
        fill="none"
        stroke="#000080"
        strokeWidth={0.7}
      />
      <circle cx={13.5} cy={9} r={0.45} fill="#000080" />
    </svg>
  );
}

/** Padlock outline — inherits `currentColor`. */
function IconLock({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
    >
      <rect
        x={5}
        y={11}
        width={14}
        height={10}
        rx={2}
        stroke="currentColor"
        strokeWidth={1.5}
      />
      <path
        d="M8 11V8a4 4 0 018 0v3"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
      <circle cx={12} cy={16} r={1} fill="currentColor" />
    </svg>
  );
}

/**
 * Default shipping / payments strip when site mode is inactive.
 */
function DefaultAnnouncementContent() {
  return (
    <>
      <div className="mx-auto flex max-w-[1320px] flex-col items-center justify-center gap-1.5 px-4 py-2.5 md:hidden">
        <p className="flex items-center gap-2.5 text-white">
          <IconTruck className="size-[18px] shrink-0 text-gold" aria-hidden />
          <span className="flex flex-col gap-0.5 text-left leading-tight">
            <span className="text-[0.6875rem] font-bold uppercase tracking-[0.08em]">
              FREE SHIPPING
            </span>
            <span className="text-[0.6875rem] font-normal normal-case tracking-normal">
              on all orders
            </span>
          </span>
        </p>
        <p className="flex items-center gap-2 text-white">
          <IconIndiaFlag className="shrink-0 rounded-[1px] ring-1 ring-white/25" />
          <span className="text-[0.6875rem] font-medium uppercase tracking-[0.06em]">
            Free COD — Cash On Delivery Pan India
          </span>
        </p>
      </div>

      <div className="mx-auto hidden max-w-[1320px] items-center px-4 py-2.5 text-[0.6875rem] font-medium uppercase tracking-[0.06em] text-white md:grid md:grid-cols-3 md:px-8 lg:px-12">
        <p className="flex items-center gap-2 justify-self-start">
          <IconTruck className="shrink-0 text-gold" />
          <span>Free shipping on all orders</span>
        </p>
        <p className="flex items-center justify-center gap-2 justify-self-center">
          <IconIndiaFlag className="shrink-0 rounded-[1px] ring-1 ring-white/25" />
          <span>Free COD — Cash On Delivery Pan India</span>
        </p>
        <p className="flex items-center gap-2 justify-self-end">
          <IconLock className="shrink-0 text-gold" />
          <span>Secure Payments</span>
        </p>
      </div>
    </>
  );
}

/**
 * Slim evergreen promo strip — live site mode from client API, else shipping + payments.
 */
export function AnnouncementBar() {
  const { siteMode } = useSiteMode();

  if (siteMode.active) {
    return <SiteModeStrip siteMode={siteMode} withShell />;
  }

  return (
    <div
      className="border-b border-black/15 bg-[#142920]"
      role="region"
      aria-label="Store announcements"
    >
      <DefaultAnnouncementContent />
    </div>
  );
}
