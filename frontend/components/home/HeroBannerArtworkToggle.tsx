"use client";

import { usePathname } from "next/navigation";
import { useHeroBannerVariant } from "@/components/home/HeroBannerVariantProvider";

/** Sun outline — `currentColor` stroke; indicates switching to the light hero artwork. */
function IconSun({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width={22} height={22} fill="none" aria-hidden>
      <circle cx="12" cy="12" r="4" stroke="currentColor" strokeWidth={1.5} />
      <path
        d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M4.93 19.07l1.41-1.41M17.66 6.34l1.41-1.41"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Moon outline — `currentColor` stroke; indicates switching back to the default hero artwork. */
function IconMoon({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" width={22} height={22} fill="none" aria-hidden>
      <path
        d="M21 14.5A8.5 8.5 0 0110.5 4a8.5 8.5 0 009.6 9.6 8.38 8.38 0 001.9-.1z"
        stroke="currentColor"
        strokeWidth={1.5}
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Header control (home only) that toggles between default and light hero banner assets.
 */
export function HeroBannerArtworkToggle() {
  const pathname = usePathname();
  const { useLightBanner, toggleLightBanner } = useHeroBannerVariant();

  if (pathname !== "/") return null;

  return (
    <button
      type="button"
      className="inline-flex size-10 items-center justify-center rounded-md text-ink transition-colors hover:bg-beige/90"
      aria-label={useLightBanner ? "Use original hero banner" : "Use light hero banner"}
      aria-pressed={useLightBanner}
      onClick={toggleLightBanner}
    >
      {useLightBanner ? <IconMoon /> : <IconSun />}
    </button>
  );
}
