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
    imageSrc: "/assets/whychooseus/keppyoufull longer.webp",
  },
  {
    title: "Ready in 2 Minutes",
    description: "No cooking. Just soak and eat.",
    imageSrc: "/assets/whychooseus/readyintwomin.webp",
  },
  {
    title: "No Junk, Only Clean",
    description: "No refined sugar, no preservatives.",
    imageSrc: "/assets/whychooseus/nojunkonlyclean.webp",
  },
  {
    title: "Sustained Energy",
    description: "Keeps you active & fresh all day.",
    imageSrc: "/assets/whychooseus/sustained_energy.webp",
    /** Square asset — scaled to align with portrait cards, slightly smaller than 1.5×. */
    imageClassName: "scale-[1.14] origin-center mt-[-7px]",
  },
  {
    title: "Gut Friendly & Light",
    description: "Natural ingredients easy on digestion.",
    imageSrc: "/assets/whychooseus/gutfriendly.webp",
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
            sizes="(min-width: 1024px) 160px, (min-width: 640px) 148px, 140px"
            className={`object-contain object-center ${imageClassName}`.trim()}
          />
        </div>
      </article>
    </li>
  );
}

/**
 * Homepage block directly under the hero: five “why choose” pillars.
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
      </div>
    </section>
  );
}
