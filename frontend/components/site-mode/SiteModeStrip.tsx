"use client";

import type { PublicSiteMode } from "@/lib/types/site-mode";
import { CountdownTimer } from "@/components/site-mode/CountdownTimer";
import { useSiteMode } from "@/components/site-mode/SiteModeProvider";

export type SiteModeStripProps = {
  siteMode: PublicSiteMode;
  /** When true, wraps content in the outer dark-green region shell. */
  withShell?: boolean;
};

/** Clock outline icon for timer rows. */
function IconClock({ className }: { className?: string }) {
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
      <circle cx={12} cy={12} r={9} stroke="currentColor" strokeWidth={1.5} />
      <path d="M12 7v5l3 2" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" />
    </svg>
  );
}

/**
 * Inner content for the site mode promo strip — headline, optional message, countdown.
 */
function SiteModeStripContent({ siteMode }: { siteMode: PublicSiteMode }) {
  const { refreshSiteMode } = useSiteMode();

  if (!siteMode.active || !siteMode.endsAt) return null;

  const onExpire = () => void refreshSiteMode();

  return (
    <>
      <div className="mx-auto flex max-w-[1320px] items-center justify-center px-4 py-2.5 md:hidden">
        <p className="flex flex-col items-center gap-1 text-center text-white">
          <span className="text-[0.6875rem] font-bold uppercase tracking-[0.08em]">{siteMode.headline}</span>
          {siteMode.message ? (
            <span className="text-[0.6875rem] font-normal normal-case tracking-normal text-white/90">
              {siteMode.message}
            </span>
          ) : null}
          <span className="mt-0.5 flex items-center gap-1.5 font-mono text-[0.75rem] font-semibold tabular-nums text-gold">
            <IconClock className="size-4 shrink-0" />
            <CountdownTimer endsAt={siteMode.endsAt} onExpire={onExpire} />
          </span>
        </p>
      </div>

      <div className="mx-auto hidden max-w-[1320px] flex-wrap items-center justify-center gap-x-6 gap-y-2 px-4 py-2.5 text-[0.6875rem] font-medium uppercase tracking-[0.06em] text-white sm:justify-between md:flex md:px-8 lg:px-12">
        <p className="flex items-center gap-2">
          <IconClock className="shrink-0 text-gold" />
          <span>{siteMode.headline}</span>
        </p>
        {siteMode.message ? (
          <p className="normal-case tracking-normal text-white/90">{siteMode.message}</p>
        ) : null}
        <p className="flex items-center gap-2 font-mono text-[0.8125rem] font-semibold tabular-nums tracking-normal text-gold">
          <CountdownTimer endsAt={siteMode.endsAt} onExpire={onExpire} />
        </p>
      </div>
    </>
  );
}

/**
 * Dark green promo strip showing site-wide mode + live countdown.
 */
export function SiteModeStrip({ siteMode, withShell = true }: SiteModeStripProps) {
  if (!siteMode.active || !siteMode.endsAt) return null;

  const inner = <SiteModeStripContent siteMode={siteMode} />;

  if (!withShell) return inner;

  return (
    <div
      className="border-b border-black/15 bg-[#142920]"
      role="region"
      aria-label="Store announcements"
    >
      {inner}
    </div>
  );
}
