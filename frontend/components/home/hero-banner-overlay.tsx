import Link from "next/link";

export type HeroBannerOverlayProps = {
  /** Primary CTA target — featured product PDP when available. */
  shopHref: string;
};

/** Compact gold star for review summary. */
function StarGlyph() {
  return (
    <svg width={18} height={18} viewBox="0 0 24 24" fill="currentColor" aria-hidden className="text-gold">
      <path d="M12 3.3l2.35 5.45 5.9.52-4.48 3.88 1.35 5.76L12 15.9l-5.12 3.06 1.35-5.76-4.48-3.88 5.9-.52L12 3.3z" />
    </svg>
  );
}

/**
 * Muscle / protein mark for the hero highlights rail.
 */
function IconHighProtein() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" className="text-gold" aria-hidden>
      <path
        d="M7.5 10.5c1-3 3.5-4.5 6-4 2.8.6 4 3.5 3.5 6.5M10 8.5l2 1.5M5 14l2.5-1M4 20l6-5.5 3 1.5M14 9l3.5 5M17.5 18L20 20"
        stroke="currentColor"
        strokeWidth={1.35}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Stylized plant stalk for fiber. */
function IconFiber() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" className="text-gold" aria-hidden>
      <path
        d="M12 20V10M12 10c-2-2-2.5-5-2-7M12 10c2-1.5 2.8-4 2.2-6.5M9 13c-1.5 1-3.5 1.2-5 .8M15 13c1.5 1 3.5 1.2 5 .8"
        stroke="currentColor"
        strokeWidth={1.35}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Small cubes for natural sweetness. */
function IconNaturalSweet() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" className="text-gold" aria-hidden>
      <path
        d="M8 10l-3-1.7v3.4L8 13l3-1.7v-3.4L8 10zM16 7l-2.5-1.5v3L16 10l2.5-1.5v-3L16 7zM14 14l-2.5-1.5v3L14 17l2.5-1.5v-3L14 14z"
        stroke="currentColor"
        strokeWidth={1.2}
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Sugar cube with slash. */
function IconNoAddedSugar() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" className="text-gold" aria-hidden>
      <rect x={6} y={8} width={10} height={10} rx={1.5} stroke="currentColor" strokeWidth={1.35} />
      <path d="M7 17l12-12" stroke="currentColor" strokeWidth={1.35} strokeLinecap="round" />
    </svg>
  );
}

/** Bottle with slash for no additives. */
function IconNoAdditives() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" className="text-gold" aria-hidden>
      <path
        d="M10 3h4v3l2 2v11a2 2 0 01-2 2h-4a2 2 0 01-2-2V8l2-2V3z"
        stroke="currentColor"
        strokeWidth={1.35}
        strokeLinejoin="round"
      />
      <path d="M6.5 18.5l13-13" stroke="currentColor" strokeWidth={1.35} strokeLinecap="round" />
    </svg>
  );
}

/** Check in circle — natural ingredients. */
function IconNatural() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" className="text-gold shrink-0" aria-hidden>
      <circle cx={12} cy={12} r={9} stroke="currentColor" strokeWidth={1.35} />
      <path d="M8 12l2.5 2.5L16 9" stroke="currentColor" strokeWidth={1.35} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Leaf — no preservatives. */
function IconLeaf() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" className="text-gold shrink-0" aria-hidden>
      <path
        d="M12 20c4-4 4.5-9.5 3-14-4.5 1.5-10 5-10 12a7 7 0 007 7v-5z"
        stroke="currentColor"
        strokeWidth={1.35}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Simplified India tricolor disc. */
function IconIndia() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" className="shrink-0" aria-hidden>
      <circle cx={12} cy={12} r={9} stroke="rgba(255,255,255,0.35)" strokeWidth={1.2} />
      <path d="M3 9h18v2H3V9zM3 13h18v2H3v-2z" fill="#FF9933" />
      <path d="M3 11h18v2H3v-2z" fill="#FFFFFF" />
      <path d="M3 13h18v2H3v-2z" fill="#138808" />
      <circle cx={12} cy={12} r={1.2} fill="#000080" />
    </svg>
  );
}

/** Shield + plate for FSSAI cue. */
function IconCertified() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" className="text-gold shrink-0" aria-hidden>
      <path
        d="M12 21s8-4 8-10V7l-8-3-8 3v4c0 6 8 10 8 10z"
        stroke="currentColor"
        strokeWidth={1.35}
        strokeLinejoin="round"
      />
      <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth={1.35} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

type FeatureItem = { id: string; label: string; Icon: () => JSX.Element };

const FEATURES: FeatureItem[] = [
  { id: "protein", label: "High protein", Icon: IconHighProtein },
  { id: "fiber", label: "Rich in fiber", Icon: IconFiber },
  { id: "sweet", label: "Naturally sweet", Icon: IconNaturalSweet },
  { id: "sugar", label: "No added sugar", Icon: IconNoAddedSugar },
  { id: "additives", label: "No additives", Icon: IconNoAdditives },
];

/** Feature cell in the four-column mobile icon rail (`lines` = one or two rows under the glyph). */
type MobileHeroFeature = {
  id: string;
  lines: readonly [string, string?];
  Icon: () => JSX.Element;
};

/** Four-icon rail on small screens — aligned with mobile hero artwork. */
const MOBILE_HERO_FEATURES: MobileHeroFeature[] = [
  { id: "protein", lines: ["High", "protein"], Icon: IconHighProtein },
  { id: "sugar", lines: ["No added", "sugar"], Icon: IconNoAddedSugar },
  { id: "preservatives", lines: ["No added", "preservatives"], Icon: IconLeaf },
  { id: "fiber", lines: ["Rich in", "fiber"], Icon: IconFiber },
];

/** Keeps copy readable on the bare banner art without dimming or blurring the image. */
const HERO_TEXT_SHADOW =
  "[text-shadow:0_1px_2px_rgba(0,0,0,0.9),0_2px_16px_rgba(0,0,0,0.55)]";

/**
 * Accessible copy, CTAs, and trust marks over the hero — no full-bleed wash or backdrop blur so the photo stays sharp.
 */
export function HeroBannerOverlay({ shopHref }: HeroBannerOverlayProps) {
  /** Horizontal inset from hero edges; stays modest on large screens so copy sits closer to the art. */
  const gutterX =
    "px-4 sm:px-5 md:px-6 lg:px-7 xl:px-8 2xl:px-10";

  return (
    <div className="pointer-events-none absolute inset-0 flex min-h-0 flex-col">
      <div className="relative z-[1] flex h-full min-h-0 flex-1 flex-col justify-start pt-5 md:h-auto md:justify-center md:pt-4">
        <div className={`flex min-h-0 w-full flex-1 flex-col ${gutterX} pb-4 pt-1 md:block md:flex-none md:pb-6 md:pt-4 lg:pb-7`}>
          <div className="flex min-h-0 flex-1 flex-col md:block md:flex-none">
            <div className="flex max-w-xl min-h-0 flex-1 flex-col text-left lg:max-w-2xl md:block md:flex-none">
            <h1
              className={`font-display text-[1.65rem] font-bold uppercase leading-[1.1] tracking-wide text-cream sm:text-3xl md:text-display-lg lg:text-display-xl ${HERO_TEXT_SHADOW}`}
            >
              <span className="block text-cream">Clean nutrition.</span>
              <span className="mt-1 block text-gold">Zero hassle.</span>
            </h1>
            <p
              className={`mt-3 max-w-md font-sans text-sm leading-relaxed text-cream/95 md:mt-5 md:text-body-lg ${HERO_TEXT_SHADOW}`}
            >
              <span className="md:hidden">
                Pre-portioned soaked breakfast packs made with the goodness of 10 powerful ingredients.
              </span>
              <span className="hidden md:inline">
                Pre-portioned soaked breakfast packs made with the goodness of 10 powerful ingredients. Just soak
                and start your day the smart way!
              </span>
            </p>

            <div className="mt-4 md:mt-6 md:hidden">
              <Link
                href={shopHref}
                className="pointer-events-auto inline-flex h-11 w-full min-w-[11rem] max-w-[20rem] items-center justify-center rounded-lg bg-gradient-to-b from-gold-soft to-gold px-6 font-sans text-sm font-bold uppercase tracking-wide text-forest transition [text-shadow:none] hover:brightness-105 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cream"
              >
                Shop now
              </Link>
            </div>

            <ul
              className="mt-5 grid grid-cols-4 gap-x-1.5 gap-y-2 md:hidden"
              aria-label="Product highlights"
            >
              {MOBILE_HERO_FEATURES.map(({ id, lines, Icon }) => (
                <li key={id} className="flex flex-col items-center gap-2 text-center">
                  <span className="flex size-11 items-center justify-center rounded-full border border-white/25 bg-white/10 shadow-sm">
                    <Icon />
                  </span>
                  <span
                    className={`font-sans text-[0.5rem] font-semibold uppercase leading-tight tracking-[0.02em] text-cream sm:text-[0.5625rem] ${HERO_TEXT_SHADOW}`}
                  >
                    <span className="block">{lines[0]}</span>
                    {lines[1] ? <span className="block">{lines[1]}</span> : null}
                  </span>
                </li>
              ))}
            </ul>

            <ul
              className="mt-4 hidden flex-wrap gap-x-3 gap-y-2 md:mt-6 md:flex md:gap-x-4"
              aria-label="Product highlights"
            >
              {FEATURES.map(({ id, label, Icon }) => (
                <li
                  key={id}
                  className="flex items-center gap-1.5 rounded-full border border-white/25 bg-black/40 px-2.5 py-1 md:gap-2 md:px-3"
                >
                  <span className="flex size-7 items-center justify-center rounded-full bg-white/10 md:size-8">
                    <Icon />
                  </span>
                  <span
                    className={`font-sans text-[0.625rem] font-semibold uppercase tracking-wide text-cream md:text-eyebrow ${HERO_TEXT_SHADOW}`}
                  >
                    {label}
                  </span>
                </li>
              ))}
            </ul>

            <div className="mt-5 hidden flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center md:mt-7 md:flex">
              <Link
                href={shopHref}
                className="pointer-events-auto inline-flex h-11 items-center justify-center rounded-md bg-gold px-6 font-sans text-sm font-semibold uppercase tracking-wide text-forest [text-shadow:none] shadow-sm transition hover:bg-gold-soft focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cream"
              >
                Shop now
              </Link>
              <Link
                href="/#perfect-for-you"
                className="pointer-events-auto inline-flex h-11 items-center justify-center gap-2 rounded-md border border-cream/80 bg-transparent px-6 font-sans text-sm font-semibold uppercase tracking-wide text-cream transition hover:bg-white/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-cream"
              >
                Learn more
                <span aria-hidden>→</span>
              </Link>
            </div>

            <p
              className={`mt-auto flex flex-wrap items-center gap-2 border-t border-white/10 pt-6 font-sans text-body-sm text-cream/95 md:mt-5 md:border-t-0 md:pt-0 ${HERO_TEXT_SHADOW}`}
            >
              <span className="flex items-center gap-0.5" aria-label="4.8 out of 5 stars">
                {Array.from({ length: 5 }).map((_, i) => (
                  <StarGlyph key={i} />
                ))}
              </span>
              <span className="font-semibold tabular-nums">4.8/5</span>
              <span className="text-cream/80">(1,248+ reviews)</span>
            </p>
          </div>
          </div>
        </div>
      </div>

      <div
        className="relative z-[1] mt-auto hidden shrink-0 border-t border-line-dark/40 bg-forest md:block"
        role="list"
        aria-label="Certifications and quality"
      >
        <div
          className={`mx-auto grid w-full grid-cols-2 gap-y-3 py-3 sm:flex sm:flex-wrap sm:justify-center sm:gap-0 ${gutterX}`}
        >
          {[
            { id: "nat", icon: <IconNatural />, label: "100% natural ingredients" },
            { id: "pre", icon: <IconLeaf />, label: "No preservatives" },
            { id: "in", icon: <IconIndia />, label: "Made in India" },
            { id: "fssai", icon: <IconCertified />, label: "FSSAI certified" },
          ].map((row, idx) => (
            <div
              key={row.id}
              role="listitem"
              className={`flex items-center justify-center gap-2 px-2 py-1 text-center font-sans text-[0.65rem] font-medium uppercase leading-tight tracking-wide text-cream/95 sm:flex-1 sm:px-4 md:text-eyebrow ${
                idx > 0 ? "sm:border-l sm:border-white/20" : ""
              }`}
            >
              {row.icon}
              <span>{row.label}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
