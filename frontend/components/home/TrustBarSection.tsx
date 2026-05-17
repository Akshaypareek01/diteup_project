import type { ReactNode } from "react";

/** Solid gold disc wrapping a glyph — inherits inner icon color via children wrapper. */
function GoldIconDisc({ children }: { children: ReactNode }) {
  return (
    <div
      className="flex size-11 shrink-0 items-center justify-center rounded-full bg-gold text-[#0e1f18] shadow-sm md:size-12"
      aria-hidden
    >
      {children}
    </div>
  );
}

/** Delivery truck glyph. */
function GlyphTruck() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M14 18V6a1 1 0 00-1-1H4a1 1 0 00-1 1v11a2 2 0 002 2h2"
        stroke="currentColor"
        strokeWidth={1.35}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M14 9h4l3 4v5h-3M14 18h5"
        stroke="currentColor"
        strokeWidth={1.35}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={7} cy={18} r={1.75} stroke="currentColor" strokeWidth={1.35} />
      <circle cx={17} cy={18} r={1.75} stroke="currentColor" strokeWidth={1.35} />
    </svg>
  );
}

/** Circular arrow with centered “7” for return window. */
function GlyphReturn7() {
  return (
    <span className="relative inline-flex size-[18px] items-center justify-center text-current">
      <svg className="absolute inset-0 size-[18px]" viewBox="0 0 24 24" fill="none" aria-hidden>
        <path
          d="M12 20a8 8 0 004.5-14.5M12 20a8 8 0 01-8-8 8 8 0 018-8"
          stroke="currentColor"
          strokeWidth={1.35}
          strokeLinecap="round"
        />
        <path
          d="M17 5v4h-4"
          stroke="currentColor"
          strokeWidth={1.35}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
      <span className="relative z-[1] translate-y-px text-[10px] font-bold leading-none">7</span>
    </span>
  );
}

/** House with rupee mark for COD. */
function GlyphCod() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M4 11l8-6 8 6v9a1 1 0 01-1 1h-5v-6H10v6H5a1 1 0 01-1-1v-9z"
        stroke="currentColor"
        strokeWidth={1.35}
        strokeLinejoin="round"
      />
      <text x={12} y={15.5} textAnchor="middle" fill="currentColor" fontSize={9} fontWeight={700}>
        ₹
      </text>
    </svg>
  );
}

/** Shield with padlock body for secure checkout. */
function GlyphShieldLock() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 21s7-3.6 7-9V6l-7-3-7 3v6c0 5.4 7 9 7 9z"
        stroke="currentColor"
        strokeWidth={1.35}
        strokeLinejoin="round"
      />
      <rect x={9} y={11} width={6} height={5} rx={1} stroke="currentColor" strokeWidth={1.2} />
      <path d="M11 11V9a1 1 0 012 0v2" stroke="currentColor" strokeWidth={1.2} strokeLinecap="round" />
    </svg>
  );
}

/** Headset for support. */
function GlyphHeadset() {
  return (
    <svg width={20} height={20} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M3 14v3a3 3 0 003 3h2v-9a4 4 0 018 0v9h2a3 3 0 003-3v-3"
        stroke="currentColor"
        strokeWidth={1.35}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path
        d="M21 14c0-4.418-4.134-8-9.243-8S3 9.582 3 14"
        stroke="currentColor"
        strokeWidth={1.35}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

type TrustCell = {
  id: string;
  title: string;
  subtitle: string;
  glyph: ReactNode;
};

const CELLS: TrustCell[] = [
  {
    id: "shipping",
    title: "FREE SHIPPING",
    subtitle: "On orders above ₹499",
    glyph: <GlyphTruck />,
  },
  {
    id: "returns",
    title: "7 DAYS RETURN",
    subtitle: "Hassle-free returns",
    glyph: <GlyphReturn7 />,
  },
  {
    id: "cod",
    title: "COD AVAILABLE",
    subtitle: "Pay on delivery",
    glyph: <GlyphCod />,
  },
  {
    id: "secure",
    title: "SECURE PAYMENTS",
    subtitle: "100% safe & encrypted",
    glyph: <GlyphShieldLock />,
  },
  {
    id: "support",
    title: "24/7 SUPPORT",
    subtitle: "We\u2019re here to help",
    glyph: <GlyphHeadset />,
  },
];

/**
 * Full-width evergreen trust strip: five service promises with gold disc icons and column dividers.
 */
export function TrustBarSection() {
  return (
    <section
      className="border-y border-black/20 bg-[#002b1b] py-5 text-white md:py-7"
      aria-label="Shipping, returns, and support"
    >
      <div className="mx-auto max-w-[1320px] px-4 md:px-8 lg:px-12">
        <ul className="flex flex-col divide-y divide-white/[0.12] md:flex-row md:divide-x md:divide-y-0 md:divide-white/[0.12]">
          {CELLS.map((cell) => (
            <li
              key={cell.id}
              className="flex flex-1 basis-0 items-center gap-4 px-2 py-4 first:pt-3 last:pb-3 md:gap-5 md:px-5 md:py-5 md:first:pt-5 md:last:pb-5"
            >
              <GoldIconDisc>{cell.glyph}</GoldIconDisc>
              <div className="min-w-0 flex-1 text-left">
                <p className="font-sans text-[0.6875rem] font-bold uppercase leading-tight tracking-[0.06em] text-white md:text-[0.75rem]">
                  {cell.title}
                </p>
                <p className="mt-1 font-sans text-[0.6875rem] font-normal leading-snug text-white/85 md:text-body-sm">
                  {cell.subtitle}
                </p>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
