import type { ReactNode } from "react";

/** Outline backpack student figure — inherits `currentColor`. */
function IconStudent() {
  return (
    <svg width={26} height={26} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx={12} cy={7} r={2.25} stroke="currentColor" strokeWidth={1.35} />
      <path d="M8 21v-6l2-5h4l2 5v6" stroke="currentColor" strokeWidth={1.35} strokeLinecap="round" strokeLinejoin="round" />
      <rect x={14} y={11} width={5} height={6} rx={1} stroke="currentColor" strokeWidth={1.35} />
      <path d="M14 13h5" stroke="currentColor" strokeWidth={1.35} strokeLinecap="round" />
    </svg>
  );
}

/** Barbell icon — inherits `currentColor`. */
function IconGym() {
  return (
    <svg width={26} height={26} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 12h16" stroke="currentColor" strokeWidth={1.35} strokeLinecap="round" />
      <path d="M4 9v6M20 9v6" stroke="currentColor" strokeWidth={1.35} strokeLinecap="round" />
      <path d="M2 10v4M22 10v4" stroke="currentColor" strokeWidth={1.35} strokeLinecap="round" />
      <rect x={7} y={10} width={3} height={4} rx={0.5} stroke="currentColor" strokeWidth={1.2} />
      <rect x={14} y={10} width={3} height={4} rx={0.5} stroke="currentColor" strokeWidth={1.2} />
    </svg>
  );
}

/** Desk + seated worker silhouette — inherits `currentColor`. */
function IconOffice() {
  return (
    <svg width={26} height={26} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path d="M4 17h16v3H4v-3z" stroke="currentColor" strokeWidth={1.35} strokeLinejoin="round" />
      <path d="M6 17V14l3-2h6l3 2v3" stroke="currentColor" strokeWidth={1.35} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={12} cy={8} r={2} stroke="currentColor" strokeWidth={1.35} />
      <path d="M12 10v3l-2 2" stroke="currentColor" strokeWidth={1.35} strokeLinecap="round" />
      <rect x={14} y={12} width={5} height={3} rx={0.5} stroke="currentColor" strokeWidth={1.2} />
    </svg>
  );
}

/** Waistline with measuring tape — inherits `currentColor`. */
function IconWeightWatcher() {
  return (
    <svg width={26} height={26} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 10c0 4 1.5 7 3 7s3-3 3-7"
        stroke="currentColor"
        strokeWidth={1.35}
        strokeLinecap="round"
      />
      <path
        d="M8 17c3 2 7 2 10 0"
        stroke="currentColor"
        strokeWidth={1.35}
        strokeLinecap="round"
      />
      <circle cx={17} cy={15} r={2} stroke="currentColor" strokeWidth={1.2} />
      <path d="M17 13v4M16 14h2M16 16h2" stroke="currentColor" strokeWidth={0.9} strokeLinecap="round" />
    </svg>
  );
}

/** Adult figure with child — inherits `currentColor`. */
function IconBusyMom() {
  return (
    <svg width={26} height={26} viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx={9} cy={8} r={1.75} stroke="currentColor" strokeWidth={1.35} />
      <path d="M9 10v4l-2 5M9 14l3 2" stroke="currentColor" strokeWidth={1.35} strokeLinecap="round" strokeLinejoin="round" />
      <circle cx={15} cy={11} r={1.35} stroke="currentColor" strokeWidth={1.2} />
      <path d="M15 12.5v3l1 3M14 14l2 1" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Sprouting leaf pair — inherits `currentColor`. */
function IconHealthyLeaf() {
  return (
    <svg width={26} height={26} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 19v-6M12 13c3-4 8-5 8-1s-5 6-8 3"
        stroke="currentColor"
        strokeWidth={1.35}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M12 13c-3-4-8-5-8-1s5 6 8 3"
        stroke="currentColor"
        strokeWidth={1.35}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type AudienceCardProps = {
  title: string;
  subtitle: string;
  icon: ReactNode;
};

/** Single persona tile: line icon left, title + supporting line right. */
function AudienceCard({ title, subtitle, icon }: AudienceCardProps) {
  return (
    <article className="flex min-h-[5.5rem] gap-3 rounded-xl bg-[#F7F1E9] px-4 py-4 shadow-xs md:gap-3.5 md:px-4 md:py-5">
      <div className="flex shrink-0 items-start pt-0.5 text-forest" aria-hidden>
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <h3 className="font-sans text-[0.9375rem] font-bold leading-snug text-ink">{title}</h3>
        <p className="mt-1 font-sans text-body-sm leading-relaxed text-ink-soft">{subtitle}</p>
      </div>
    </article>
  );
}

const AUDIENCES: AudienceCardProps[] = [
  {
    title: "Students",
    subtitle: "Quick & healthy before classes",
    icon: <IconStudent />,
  },
  {
    title: "Gym & Fitness",
    subtitle: "High protein for active you",
    icon: <IconGym />,
  },
  {
    title: "Office Workers",
    subtitle: "No morning cooking stress",
    icon: <IconOffice />,
  },
  {
    title: "Weight Watchers",
    subtitle: "Light, nutritious & satisfying",
    icon: <IconWeightWatcher />,
  },
  {
    title: "Busy Moms",
    subtitle: "Healthy for the whole family",
    icon: <IconBusyMom />,
  },
  {
    title: "Healthy Lifestyle",
    subtitle: "Clean nutrition, every day",
    icon: <IconHealthyLeaf />,
  },
];

/**
 * Persona strip — who EnergyBite fits; serif headline + six beige tiles with outline icons.
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

        <div className="mt-11 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 xl:gap-3">
          {AUDIENCES.map((item) => (
            <AudienceCard key={item.title} title={item.title} subtitle={item.subtitle} icon={item.icon} />
          ))}
        </div>
      </div>
    </section>
  );
}
