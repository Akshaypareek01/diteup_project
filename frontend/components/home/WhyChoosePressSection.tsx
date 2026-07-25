import Image from "next/image";

type FeatureItem = {
  title: string;
  description: string;
  imageSrc: string;
  /** Extra classes when asset aspect ratio differs (e.g. square vs portrait). */
  imageClassName?: string;
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
}: FeatureCardProps) {
  const alt = `${title}. ${description}`;

  return (
    <li className="w-[8.75rem] shrink-0 sm:w-[9.25rem] md:w-[9.5rem] xl:w-[10rem]">
      <article className="flex w-full flex-col overflow-hidden rounded-xl bg-[#F7F1E9] shadow-xs">
        <div className="relative aspect-[2/3] w-full">
          <Image
            src={imageSrc}
            alt={alt}
            fill
            sizes="(min-width: 1280px) 160px, (min-width: 768px) 152px, (min-width: 640px) 148px, 140px"
            className={`object-contain object-center ${imageClassName}`.trim()}
          />
        </div>
      </article>
    </li>
  );
}

/**
 * Homepage block directly under the hero: five “why choose” pillars.
 * Fixed-width cards + flex-wrap/justify-center keep rows clustered
 * (2+2+1 / 3+2 / 5) instead of stretching to the container edges.
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
          className="mx-auto mt-10 flex w-full max-w-[calc(2*8.75rem+0.75rem)] list-none flex-wrap justify-center gap-x-3 gap-y-5 sm:max-w-[calc(3*9.25rem+2*1rem)] sm:gap-x-4 md:max-w-[calc(3*9.5rem+2*1.25rem)] md:gap-x-5 lg:mt-12 lg:max-w-none lg:gap-x-4 xl:gap-x-5"
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
