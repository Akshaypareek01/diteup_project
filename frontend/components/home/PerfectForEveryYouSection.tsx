import Image from "next/image";

type AudienceCardProps = {
  title: string;
  subtitle: string;
  imageSrc: string;
  imageWidth: number;
  imageHeight: number;
};

type AudienceIconProps = Pick<AudienceCardProps, "imageSrc" | "imageWidth" | "imageHeight">;

/**
 * Shows the full line icon from padded persona PNG canvases without cropping.
 */
function AudienceIcon({ imageSrc, imageWidth, imageHeight }: AudienceIconProps) {
  return (
    <div
      className="flex h-14 w-11 shrink-0 items-center justify-center sm:h-[3.75rem] sm:w-12"
      aria-hidden
    >
      <Image
        src={imageSrc}
        alt=""
        width={imageWidth}
        height={imageHeight}
        sizes="48px"
        className="h-full w-full object-contain"
      />
    </div>
  );
}

/** Single persona tile: icon left, title + supporting line right. */
function AudienceCard({ title, subtitle, imageSrc, imageWidth, imageHeight }: AudienceCardProps) {
  return (
    <article className="flex min-h-[5.25rem] items-center gap-2 rounded-xl bg-[#F7F1E9] px-2.5 py-3 sm:gap-2.5 sm:px-3">
      <AudienceIcon imageSrc={imageSrc} imageWidth={imageWidth} imageHeight={imageHeight} />
      <div className="min-w-0 flex-1">
        <h3 className="font-sans text-[0.8125rem] font-bold leading-tight text-ink">{title}</h3>
        <p className="mt-1 font-sans text-[0.6875rem] leading-snug text-ink-soft">{subtitle}</p>
      </div>
    </article>
  );
}

const AUDIENCES: AudienceCardProps[] = [
  {
    title: "Students",
    subtitle: "Quick & healthy before classes",
    imageSrc: "/assets/perfectforeveryyou/students_icon.png",
    imageWidth: 1024,
    imageHeight: 1536,
  },
  {
    title: "Gym & Fitness",
    subtitle: "High protein for active you",
    imageSrc: "/assets/perfectforeveryyou/gym_icon.png",
    imageWidth: 1024,
    imageHeight: 1536,
  },
  {
    title: "Office Workers",
    subtitle: "No morning cooking stress",
    imageSrc: "/assets/perfectforeveryyou/office_work_icon.png",
    imageWidth: 1024,
    imageHeight: 1024,
  },
  {
    title: "Weight Watchers",
    subtitle: "Light, nutritious & satisfying",
    imageSrc: "/assets/perfectforeveryyou/weight_wathcers_cion.png",
    imageWidth: 1024,
    imageHeight: 1024,
  },
  {
    title: "Busy Moms",
    subtitle: "Healthy for the whole family",
    imageSrc: "/assets/perfectforeveryyou/busy_moms_icon.png",
    imageWidth: 1024,
    imageHeight: 1536,
  },
  {
    title: "Healthy Lifestyle",
    subtitle: "Clean nutrition, every day",
    imageSrc: "/assets/perfectforeveryyou/health_icon.png",
    imageWidth: 1024,
    imageHeight: 1536,
  },
];

/**
 * Persona strip — who EnergyBite fits; serif headline + six beige tiles with persona icons.
 */
export function PerfectForEveryYouSection() {
  return (
    <section
      id="perfect-for-you"
      className="scroll-mt-[104px] border-b border-line/60 bg-[#FDFBF7] py-14 md:py-20"
      aria-labelledby="perfect-for-heading"
    >
      <div className="mx-auto max-w-[1320px] px-5 md:px-8 lg:px-12">
        <header className="mx-auto max-w-2xl text-center">
          <h2
            id="perfect-for-heading"
            className="font-display text-display-md font-bold uppercase tracking-[0.06em] text-ink md:text-display-lg"
          >
            Perfect for every you
          </h2>
          <p className="mt-3 font-sans text-body-lg font-normal text-ink-soft">
            Healthy breakfast for every lifestyle
          </p>
        </header>

        <div className="mt-11 grid grid-cols-1 gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 lg:gap-2">
          {AUDIENCES.map((item) => (
            <AudienceCard key={item.title} {...item} />
          ))}
        </div>
      </div>
    </section>
  );
}
