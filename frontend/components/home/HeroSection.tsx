"use client";

import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { IconPlaceholder } from "@/components/placeholders/IconPlaceholder";
import { ImagePlaceholder } from "@/components/placeholders/ImagePlaceholder";
import { fadeUp, stagger, viewportOnce } from "@/lib/motion";
import type { PublicProduct } from "@/lib/types/catalog";
import { formatInr, moneyNumber } from "@/lib/format-money";
import { pixelViewContent } from "@/lib/meta-pixel-events";

const defaultBenefits = [
  "High protein",
  "Rich fiber",
  "No preservatives",
  "Naturally sweet",
  "Quick prep",
];

export type HeroSectionProps = {
  featured: PublicProduct | null;
};

/**
 * Forest hero — pulls featured product from API when available.
 */
export function HeroSection({ featured }: HeroSectionProps) {
  const tracked = useRef(false);
  useEffect(() => {
    if (tracked.current || !featured?.variants?.length) return;
    tracked.current = true;
    const v = featured.variants.find((x) => x.isDefault) ?? featured.variants[0];
    pixelViewContent({
      content_ids: [v.id],
      value: moneyNumber(v.priceSale),
      currency: "INR",
    });
  }, [featured]);

  const heroHref = featured ? `/product/${featured.slug}` : "/";
  const fromPrice =
    featured && featured.variants.length > 0
      ? Math.min(...featured.variants.map((v) => moneyNumber(v.priceSale)))
      : null;
  const badge = featured?.displayBadge?.trim() || "Bestseller";
  const benefits = defaultBenefits;
  return (
    <section
      className="bg-gradient-hero text-cream"
      aria-labelledby="hero-heading"
    >
      <div className="mx-auto grid max-w-[1320px] gap-10 px-5 py-14 md:grid-cols-2 md:items-center md:gap-12 md:px-8 lg:gap-16 lg:px-12 lg:py-20">
        <motion.div
          initial="hidden"
          whileInView="show"
          viewport={viewportOnce}
          variants={stagger(0.06, 0.05)}
        >
          <motion.p variants={fadeUp} className="font-sans text-eyebrow text-gold/90">
            {featured?.name ?? "DiteUp"}
          </motion.p>
          <motion.h1
            variants={fadeUp}
            id="hero-heading"
            className="font-display text-display-2xl mt-3 text-balance font-semibold text-cream"
          >
            CLEAN NUTRITION. ZERO HASSLE.
          </motion.h1>
          <motion.p variants={fadeUp} className="mt-5 max-w-xl text-body-lg text-cream/85">
            {featured?.shortDesc ??
              "Soak-at-night breakfast — premium nuts, seeds, and zero compromise. Pouch + scatter photography replaces the placeholder."}
          </motion.p>
          <motion.ul
            variants={fadeUp}
            className="mt-6 flex flex-wrap gap-3 md:flex-wrap"
            aria-label="Product highlights"
          >
            {benefits.map((b) => (
              <li
                key={b}
                className="flex items-center gap-2 rounded-full border border-line-dark/40 bg-sage/40 px-3 py-2 text-body-sm"
              >
                <IconPlaceholder label={`${b} icon`} size="sm" rounded="circle" />
                {b}
              </li>
            ))}
          </motion.ul>

          <motion.div
            variants={fadeUp}
            className="mt-6 flex justify-center gap-4 md:hidden"
            aria-label="Preparation motto"
          >
            {["Soak at night", "Eat in morning"].map((t) => (
              <div
                key={t}
                className="flex flex-col items-center gap-2 text-center text-body-sm font-medium"
              >
                <span className="flex size-16 items-center justify-center rounded-full border border-gold/50 bg-sage/50">
                  <IconPlaceholder label={`${t} icon`} size="md" rounded="circle" />
                </span>
                {t}
              </div>
            ))}
          </motion.div>

          <motion.div variants={fadeUp} className="mt-8 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <Button href={heroHref} variant="primaryGold" size="lg" className="w-full sm:w-auto">
              {featured ? `Shop — from ${formatInr(fromPrice ?? 0)}` : "Shop now"}
            </Button>
            <Button
              href="#about"
              variant="secondaryCream"
              size="lg"
              className="w-full sm:w-auto"
            >
              Learn more →
            </Button>
          </motion.div>
        </motion.div>

        <div className="relative md:py-4">
          <div className="absolute -right-2 top-4 z-10 hidden max-w-[140px] rounded-full border border-gold/60 bg-sage/90 px-4 py-3 text-center font-mono text-[10px] font-semibold uppercase leading-snug tracking-wide text-cream shadow-md md:block">
            Soak at night
            <br />
            <span className="text-gold">·</span> Eat in morning
          </div>
          <div className="relative mx-auto max-w-[520px] md:max-w-none">
            <span className="absolute left-3 top-3 z-10 rounded-full bg-gold px-3 py-1 font-mono text-eyebrow text-forest shadow-sm">
              {badge}
            </span>
            {featured?.media?.[0]?.url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={featured.media[0].url}
                alt={featured.media[0].altText ?? featured.name}
                className="w-full rounded-2xl object-cover shadow-lg md:shadow-xl aspect-[4/5] md:aspect-auto md:max-h-[560px]"
              />
            ) : (
              <ImagePlaceholder
                variant="hero"
                label="Hero — pouch + floating ingredients (webiste-mockups)"
                className="shadow-lg md:shadow-xl"
              />
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
