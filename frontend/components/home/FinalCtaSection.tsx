import Link from "next/link";

/**
 * Closing forest CTA band.
 */
export function FinalCtaSection() {
  return (
    <section className="bg-gradient-hero py-16 text-center text-cream" aria-labelledby="cta-heading">
      <div className="mx-auto max-w-[720px] px-5">
        <h2 id="cta-heading" className="font-display text-display-lg font-semibold">
          Start your morning right.
        </h2>
        <p className="mt-3 text-body-lg text-cream/85">From ₹399 · Free shipping over ₹499</p>
        <Link
          href="/product/energy-bite"
          className="mt-8 inline-flex h-14 min-w-[200px] items-center justify-center rounded-lg bg-gold px-10 font-sans text-button font-semibold uppercase tracking-wide text-forest shadow-glow-gold hover:bg-gold-soft"
        >
          Buy now
        </Link>
      </div>
    </section>
  );
}
