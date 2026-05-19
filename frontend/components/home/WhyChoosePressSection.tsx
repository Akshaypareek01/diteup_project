import Image from "next/image";

type FeatureItem = {
  title: string;
  description: string;
  imageSrc: string;
  /** Extra classes when asset aspect ratio differs (e.g. square vs portrait). */
  imageClassName?: string;
  /** Last item in a 2×2 + 1 layout spans full width on small screens. */
  wideOnNarrow?: boolean;
};

/** Order matches design: full → ready → clean → energy → gut. */
const WHY_CHOOSE_FEATURES: FeatureItem[] = [
  {
    title: "Keeps You Full Longer",
    description: "High protein & fiber keeps hunger away",
    imageSrc: "/assets/whychooseus/keppyoufull longer.png",
  },
  {
    title: "Ready in 2 Minutes",
    description: "No cooking. Just soak and eat.",
    imageSrc: "/assets/whychooseus/readyintwomin.png",
  },
  {
    title: "No Junk, Only Clean",
    description: "No refined sugar, no preservatives.",
    imageSrc: "/assets/whychooseus/nojunkonlyclean.png",
  },
  {
    title: "Sustained Energy",
    description: "Keeps you active & fresh all day.",
    imageSrc: "/assets/whychooseus/sustained_energy.png",
    /** Square asset — scaled to align with portrait cards, slightly smaller than 1.5×. */
    imageClassName: "scale-[1.14] origin-center mt-[-7px]",
  },
  {
    title: "Gut Friendly & Light",
    description: "Natural ingredients easy on digestion.",
    imageSrc: "/assets/whychooseus/gutfriendly.png",
    wideOnNarrow: true,
  },
];

type FeatureCardProps = FeatureItem;

/**
 * Beige card shell with a single artwork PNG (icon + copy baked in).
 */
function FeatureCard({
  title,
  description,
  imageSrc,
  imageClassName = "",
  wideOnNarrow = false,
}: FeatureCardProps) {
  const alt = `${title}. ${description}`;

  return (
    <li
      className={`flex min-w-0 justify-center ${wideOnNarrow ? "col-span-2 lg:col-span-1" : ""}`}
    >
      <article className="flex w-full max-w-[8.75rem] flex-col overflow-hidden rounded-xl bg-[#F7F1E9] shadow-xs sm:max-w-[9.25rem] lg:max-w-[9.5rem] xl:max-w-[10rem]">
        <div className="relative aspect-[2/3] w-full">
          <Image
            src={imageSrc}
            alt={alt}
            fill
            unoptimized
            sizes="(min-width: 1024px) 160px, (min-width: 640px) 148px, 140px"
            className={`object-contain object-center ${imageClassName}`.trim()}
          />
        </div>
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
          <p className="mt-3 hidden font-sans text-body-lg font-normal text-ink-soft md:block">
            More than just a breakfast, it&apos;s a smarter lifestyle.
          </p>
        </header>

        <ul
          className="mx-auto mt-10 grid w-full max-w-[38rem] list-none grid-cols-2 items-stretch gap-x-4 gap-y-5 sm:max-w-[40rem] sm:gap-x-5 lg:mt-12 lg:max-w-[50rem] lg:grid-cols-5 lg:gap-3 xl:max-w-[52rem] xl:gap-4"
          aria-label="Why choose DiteUp highlights"
        >
          {WHY_CHOOSE_FEATURES.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
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
