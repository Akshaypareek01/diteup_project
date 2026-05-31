import type { PublicSiteMode } from "@/lib/types/site-mode";
import { SiteModeStrip } from "@/components/site-mode/SiteModeStrip";

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

export type AnnouncementBarProps = {
  siteMode?: PublicSiteMode;
};

/**
 * Slim evergreen promo strip: site mode countdown when active, else shipping + payments.
 */
export function AnnouncementBar({ siteMode }: AnnouncementBarProps) {
  if (siteMode?.active) {
    return <SiteModeStrip siteMode={siteMode} withShell />;
  }

  return (
    <div
      className="border-b border-black/15 bg-[#142920]"
      role="region"
      aria-label="Store announcements"
    >
      <div className="mx-auto flex max-w-[1320px] items-center justify-center px-4 py-2.5 md:hidden">
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
      </div>

      <div className="mx-auto hidden max-w-[1320px] flex-wrap items-center justify-center gap-x-8 gap-y-2 px-4 py-2.5 text-[0.6875rem] font-medium uppercase tracking-[0.06em] text-white sm:justify-between md:flex md:px-8 lg:px-12">
        <p className="flex items-center gap-2">
          <IconTruck className="shrink-0 text-gold" />
          <span>Free shipping on all orders</span>
        </p>
        <p className="flex items-center gap-2">
          <IconLock className="shrink-0 text-gold" />
          <span>Secure Payments</span>
        </p>
      </div>
    </div>
  );
}
