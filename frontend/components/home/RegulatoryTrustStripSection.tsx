import type { ReactNode } from "react";

/** Override via `NEXT_PUBLIC_FSSAI_LICENSE_NO` when the real licence is configured in deployment. */
const FSSAI_LICENSE_NO =
  typeof process.env.NEXT_PUBLIC_FSSAI_LICENSE_NO === "string" &&
  process.env.NEXT_PUBLIC_FSSAI_LICENSE_NO.trim().length > 0
    ? process.env.NEXT_PUBLIC_FSSAI_LICENSE_NO.trim()
    : "10112233400234";

/** Gold outline circle framing monoline glyphs (mock: herb bundle, shield). */
function GoldRingGlyph({ children }: { children: ReactNode }) {
  return (
    <div className="flex size-[2.75rem] shrink-0 items-center justify-center rounded-full border border-gold text-white md:size-12">
      <span className="flex [&>svg]:block">{children}</span>
    </div>
  );
}

/** Herb / grain bundle glyph — inherits `currentColor`. */
function IconHerbs() {
  return (
    <svg width={21} height={21} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 18V9M12 9c-2.5-4-7-5-9-1.5-.8 2 2 6 9 10.5M12 9c2.5-4 7-5 9-1.5.8 2-2 6-9 10.5"
        stroke="currentColor"
        strokeWidth={1.35}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12 18v3" stroke="currentColor" strokeWidth={1.35} strokeLinecap="round" />
    </svg>
  );
}

/** Shield with check — inherits `currentColor`. */
function IconShieldCheck() {
  return (
    <svg width={21} height={21} viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 21s8-4 8-10V8l-8-4-8 4v3c0 6 8 10 8 10z"
        stroke="currentColor"
        strokeWidth={1.35}
        strokeLinejoin="round"
      />
      <path
        d="M9 12l2 2 4-5"
        stroke="currentColor"
        strokeWidth={1.35}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/** Compact filled star — use `text-gold` on wrapper. */
function IconGoldStar({ className }: { className?: string }) {
  return (
    <svg className={className} width={14} height={14} viewBox="0 0 24 24" aria-hidden>
      <path
        fill="currentColor"
        d="M12 2.5l2.8 7h7.4l-6 4.6 2.3 7.4L12 17l-6.5 4.5 2.3-7.4-6-4.6h7.4L12 2.5z"
      />
    </svg>
  );
}

/** Two-line uppercase promo label beside icons (white text). */
function StripCopy({ line1, line2 }: { line1: string; line2: string }) {
  return (
    <div className="min-w-0 text-[0.625rem] font-semibold uppercase leading-snug tracking-[0.07em] text-white md:text-[0.6875rem]">
      <p>{line1}</p>
      <p>{line2}</p>
    </div>
  );
}

/**
 * Slim regulatory / quality strip: FSSAI licence line, ingredient promise, safety claim, social proof snapshot.
 */
export function RegulatoryTrustStripSection() {
  return (
    <section
      id="quality-strip"
      className="scroll-mt-[104px] border-y border-black/25 bg-[#002b1b] py-4 text-white md:py-5"
      aria-label="Certifications and quality assurance"
    >
      <div className="mx-auto max-w-[1320px] px-4 md:px-8 lg:px-12">
        <ul className="flex flex-col divide-y divide-white/[0.12] md:flex-row md:divide-x md:divide-y-0 md:divide-white/[0.12]">
          <li className="flex flex-1 basis-0 items-center gap-4 px-2 py-4 md:gap-5 md:px-5 md:py-4">
            <span className="shrink-0 font-sans text-xl font-semibold lowercase tracking-tight text-white md:text-2xl">
              fssai
            </span>
            <div className="min-w-0 font-sans text-[0.6875rem] leading-tight text-white md:text-[0.75rem]">
              <p className="font-semibold uppercase tracking-[0.08em] text-white/90">Lic no.</p>
              <p className="mt-1 break-all font-medium tracking-wide text-white">{FSSAI_LICENSE_NO}</p>
            </div>
          </li>

          <li className="flex flex-1 basis-0 items-center gap-4 px-2 py-4 md:gap-5 md:px-5 md:py-4">
            <GoldRingGlyph>
              <IconHerbs />
            </GoldRingGlyph>
            <StripCopy line1="Made with real" line2="Ingredients" />
          </li>

          <li className="flex flex-1 basis-0 items-center gap-4 px-2 py-4 md:gap-5 md:px-5 md:py-4">
            <GoldRingGlyph>
              <IconShieldCheck />
            </GoldRingGlyph>
            <StripCopy line1="100% Safe" line2="& quality tested" />
          </li>

          <li className="flex flex-1 basis-0 flex-wrap items-center gap-x-4 gap-y-3 px-2 py-4 md:flex-nowrap md:gap-5 md:px-5 md:py-4">
            <div className="flex shrink-0 items-center gap-2">
              <div className="flex gap-0.5 text-gold" aria-hidden>
                <IconGoldStar />
                <IconGoldStar />
              </div>
              <div className="flex -space-x-2 ps-1" aria-hidden>
                <span className="inline-block size-8 rounded-full border-2 border-[#002b1b] bg-gradient-to-br from-rose-200 to-rose-400" />
                <span className="inline-block size-8 rounded-full border-2 border-[#002b1b] bg-gradient-to-br from-amber-100 to-amber-300" />
                <span className="inline-block size-8 rounded-full border-2 border-[#002b1b] bg-gradient-to-br from-violet-200 to-violet-400" />
              </div>
            </div>
            <StripCopy line1="Thousands of" line2="Happy customers" />
          </li>
        </ul>
      </div>
    </section>
  );
}
