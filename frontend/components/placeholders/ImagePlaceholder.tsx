import type { CSSProperties } from "react";

export type ImagePlaceholderVariant =
  | "hero"
  | "gallery"
  | "thumb"
  | "avatar"
  | "logo"
  | "card"
  | "banner"
  | "strip";

const variantClasses: Record<ImagePlaceholderVariant, string> = {
  /** ~375×500 mobile band, ~1440×600 desktop — webiste-mockups */
  hero: "aspect-[3/4] w-full min-h-[480px] max-h-[560px] rounded-xl md:aspect-[2.35/1] md:max-h-none md:min-h-[360px] lg:min-h-[480px]",
  gallery: "aspect-square w-full max-w-full rounded-xl",
  thumb: "size-16 shrink-0 rounded-md sm:size-20",
  /** ~40×40 testimonial */
  avatar: "size-10 shrink-0 rounded-full sm:size-10",
  /** ~120×40 press */
  logo: "h-10 w-[120px] shrink-0 rounded-xs",
  card: "aspect-[4/3] w-full rounded-lg",
  banner: "aspect-[21/9] min-h-[48px] w-full max-w-full rounded-none",
  /** Vertical PDP-style panel beside benefits */
  strip: "aspect-[3/5] w-full max-w-[280px] rounded-xl",
};

export type ImagePlaceholderProps = {
  label: string;
  variant: ImagePlaceholderVariant;
  className?: string;
  style?: CSSProperties;
};

/**
 * Fixed-ratio skeleton aligned to mockup export sizes; swap for `next/image` when ready.
 */
export function ImagePlaceholder({
  label,
  variant,
  className = "",
  style,
}: ImagePlaceholderProps) {
  const base =
    "relative overflow-hidden border border-line/80 bg-gradient-to-br from-beige via-paper to-beige animate-shimmer bg-[length:200%_100%]";
  return (
    <div
      role="img"
      aria-label={label}
      className={`${base} ${variantClasses[variant]} ${className}`}
      style={style}
    >
      <span className="pointer-events-none absolute bottom-2 left-2 max-w-[90%] truncate rounded-xs bg-forest/80 px-2 py-1 font-mono text-[10px] uppercase tracking-wide text-cream/90">
        {label}
      </span>
    </div>
  );
}
