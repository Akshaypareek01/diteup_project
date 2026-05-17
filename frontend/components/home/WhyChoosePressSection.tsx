import type { ReactNode } from "react";

/** Thin circle frame for feature glyph — smaller on phones, full size from `lg`. */
function IconRing({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto mb-3 flex size-11 items-center justify-center rounded-full border border-ink/25 text-ink sm:mb-4 sm:size-12 lg:mb-5 lg:size-[52px]">
      <span className="flex items-center justify-center [&>svg]:block">{children}</span>
    </div>
  );
}

/** Bowl with steam lines — outline icon. */
function IconBowlSteam() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M6 13h14v2a6 6 0 01-12 0v-2zM8 13V9a4 4 0 018 0v4"
        stroke="currentColor"
        strokeWidth={1.35}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M10 5c0 1-.5 2-.5 3M12 4v3M14 5c0 1 .5 2 .5 3"
        stroke="currentColor"
        strokeWidth={1.35}
        strokeLinecap="round"
      />
    </svg>
  );
}

/** Stopwatch outline icon. */
function IconStopwatch() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx={12} cy={14} r={7} stroke="currentColor" strokeWidth={1.35} />
      <path d="M12 11v4l2 2" stroke="currentColor" strokeWidth={1.35} strokeLinecap="round" strokeLinejoin="round" />
      <path d="M10 3h4M12 3v3" stroke="currentColor" strokeWidth={1.35} strokeLinecap="round" />
    </svg>
  );
}

/** Candy / junk outline with diagonal strike for “no junk”. */
function IconNoJunk() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M10 9l-3 9 10-9-4-6z"
        stroke="currentColor"
        strokeWidth={1.35}
        strokeLinejoin="round"
      />
      <circle cx={14} cy={10} r={1} fill="currentColor" />
      <path d="M5 19L19 5" stroke="currentColor" strokeWidth={1.35} strokeLinecap="round" />
    </svg>
  );
}

/** Sun with rays — sustained energy glyph. */
function IconSunEnergy() {
  const rays = [0, 45, 90, 135, 180, 225, 270, 315];
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx={12} cy={12} r={3.5} stroke="currentColor" strokeWidth={1.35} />
      {rays.map((deg) => (
        <line
          key={deg}
          x1={12}
          y1={4}
          x2={12}
          y2={6.5}
          stroke="currentColor"
          strokeWidth={1.35}
          strokeLinecap="round"
          transform={`rotate(${deg} 12 12)`}
        />
      ))}
    </svg>
  );
}

/** Simplified gut / digestive tract outline. */
function IconGutFriendly() {
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M8 6c2 0 3 2 3 4s-1 4-3 4-3 2-3 4 1 4 3 4h8c2 0 3-2 3-4s-1-4-3-4-3-2-3-4 1-4 3-4"
        stroke="currentColor"
        strokeWidth={1.35}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type FeatureBlockProps = {
  title: string;
  description: string;
  icon: ReactNode;
  /** Last item in a 2×2 + 1 layout spans full width on small screens. */
  wideOnNarrow?: boolean;
};

/** Benefit tile: open icon + caption on phones; beige cards from `lg` up. */
function FeatureCard({ title, description, icon, wideOnNarrow = false }: FeatureBlockProps) {
  return (
    <li
      className={`min-w-0 ${wideOnNarrow ? "col-span-2 flex justify-center lg:col-span-1" : ""}`}
    >
      <article className="flex h-full max-w-[13.5rem] flex-col text-center sm:max-w-none lg:max-w-none lg:rounded-xl lg:bg-[#F7F1E9] lg:px-5 lg:py-7 lg:shadow-xs">
        <IconRing>{icon}</IconRing>
        <h3 className="font-sans text-[0.8125rem] font-medium leading-snug text-ink sm:text-sm lg:text-base lg:font-bold">
          {title}
        </h3>
        <p className="mt-2 hidden font-sans text-body-sm leading-relaxed text-ink-soft lg:block">{description}</p>
      </article>
    </li>
  );
}

/**
 * Homepage block directly under the hero: five “why choose” pillars plus an “As seen in” press row (typographic lockups).
 */
export function WhyChoosePressSection() {
  return (
    <section
      className="border-b border-line/70 bg-[#FDFBF7] py-14 md:py-20"
      aria-labelledby="why-choose-heading"
    >
      <div className="mx-auto max-w-[1320px] px-5 md:px-8 lg:px-12">
        <header className="mx-auto max-w-3xl text-center">
          <h2
            id="why-choose-heading"
            className="font-display text-xl font-bold uppercase leading-tight tracking-[0.06em] text-ink sm:text-2xl md:text-display-md lg:text-display-lg"
          >
            Why choose DiteUp?
          </h2>
          <p className="mt-3 hidden font-sans text-body-lg font-normal text-ink-soft lg:block">
            More than just a breakfast, it&apos;s a smarter lifestyle.
          </p>
        </header>

        <ul
          className="mt-10 grid list-none grid-cols-2 gap-x-6 gap-y-10 sm:gap-x-8 lg:mt-12 lg:grid-cols-5 lg:gap-4 xl:gap-5"
          aria-label="Why choose DiteUp highlights"
        >
          <FeatureCard
            title="Keeps You Full Longer"
            description="High protein & fiber keeps hunger away"
            icon={<IconBowlSteam />}
          />
          <FeatureCard
            title="Ready in 2 Minutes"
            description="No cooking. Just soak and eat."
            icon={<IconStopwatch />}
          />
          <FeatureCard
            title="Sustained Energy"
            description="Keeps you active & fresh all day."
            icon={<IconSunEnergy />}
          />
          <FeatureCard
            title="Gut Friendly & Light"
            description="Natural ingredients easy on digestion."
            icon={<IconGutFriendly />}
          />
          <FeatureCard
            title="No Junk, Only Clean"
            description="No refined sugar, no preservatives."
            icon={<IconNoJunk />}
            wideOnNarrow
          />
        </ul>

        <div className="mt-14 md:mt-18">
          <div className="flex items-center gap-4" role="presentation">
            <span className="h-px flex-1 bg-line" aria-hidden />
            <p className="shrink-0 font-sans text-[0.6875rem] font-bold uppercase tracking-[0.18em] text-ink md:text-xs">
              As seen in
            </p>
            <span className="h-px flex-1 bg-line" aria-hidden />
          </div>

          <ul
            className="mt-10 flex list-none flex-wrap items-center justify-center gap-x-10 gap-y-6 md:justify-between md:gap-x-6 lg:gap-x-10"
            aria-label="Press coverage"
          >
            <li className="font-sans text-lg font-bold lowercase tracking-tight text-ink md:text-xl">
              mid<span className="text-error">-</span>day
            </li>
            <li className="font-sans text-lg font-medium lowercase tracking-tight text-ink/85 md:text-xl">
              healthshots
            </li>
            <li className="font-sans text-lg font-black uppercase tracking-tighter text-ink md:text-xl">
              FITNESS
            </li>
            <li className="font-display text-xs font-semibold uppercase leading-tight tracking-[0.14em] text-ink md:text-sm">
              INDIA TODAY
            </li>
            <li className="max-w-[11rem] text-center font-display text-[0.625rem] font-semibold uppercase leading-snug tracking-[0.08em] text-ink md:text-xs">
              THE TIMES OF INDIA
            </li>
          </ul>
        </div>
      </div>
    </section>
  );
}
