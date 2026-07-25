"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { dur, ease } from "@/lib/motion";
import { cn } from "@/lib/utils";

const SLIDER_INTERVAL_MS = 3000;

type AplusSlide = {
  id: string;
  title: string;
  src: string;
  alt: string;
  width: number;
  height: number;
};

const APLUS_SLIDES: AplusSlide[] = [
  {
    id: "inside",
    title: "What's inside",
    src: "/assets/Images/whatinsideiamgeweb.webp",
    alt: "What's inside DiteUp Energy Bite — 8 powerful ingredients in one perfect mix",
    width: 1672,
    height: 941,
  },
  {
    id: "why",
    title: "Why choose us",
    src: "/assets/Images/whychooseus.webp",
    alt: "Why choose DiteUp Energy Bite — clean nutrition, sustained energy, and real results",
    width: 1536,
    height: 1024,
  },
  {
    id: "compare",
    title: "How we compare",
    src: "/assets/Images/howwecompair.webp",
    alt: "DiteUp Energy Bite vs regular breakfast — smart choice for busy mornings",
    width: 1536,
    height: 1024,
  },
  {
    id: "how-to-use",
    title: "How to use",
    src: "/assets/Images/howtouseslide.webp",
    alt: "How to use DiteUp Energy Bite — soak at night, eat in the morning",
    width: 1672,
    height: 941,
  },
];

export type ProductPdpAplusContentProps = {
  className?: string;
};

/**
 * Auto-advancing A+ content carousel — one section, image highlight slides.
 */
export function ProductPdpAplusContent({ className }: ProductPdpAplusContentProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  /** Wraps slide index for prev/next and dot navigation. */
  const goTo = useCallback((next: number) => {
    setIndex(((next % APLUS_SLIDES.length) + APLUS_SLIDES.length) % APLUS_SLIDES.length);
  }, []);

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % APLUS_SLIDES.length);
    }, SLIDER_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [paused]);

  const active = APLUS_SLIDES[index];

  return (
    <section
      aria-labelledby="pdp-aplus-heading"
      className={cn(className)}
      aria-roledescription="carousel"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) {
          setPaused(false);
        }
      }}
    >
      <div className="flex items-end justify-between gap-4">
        <h2 id="pdp-aplus-heading" className="font-display text-display-md font-semibold text-forest">
          {active.title}
        </h2>
        <p className="sr-only" aria-live="polite">
          Slide {index + 1} of {APLUS_SLIDES.length}: {active.title}
        </p>
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => goTo(index - 1)}
            aria-label="Previous highlight"
            className="inline-flex size-9 items-center justify-center rounded-full border border-line bg-paper text-forest transition hover:bg-cream focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
          >
            <svg className="size-4" viewBox="0 0 24 24" fill="none" aria-hidden stroke="currentColor" strokeWidth="2">
              <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => goTo(index + 1)}
            aria-label="Next highlight"
            className="inline-flex size-9 items-center justify-center rounded-full border border-line bg-paper text-forest transition hover:bg-cream focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest"
          >
            <svg className="size-4" viewBox="0 0 24 24" fill="none" aria-hidden stroke="currentColor" strokeWidth="2">
              <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>
      </div>

      <article aria-labelledby="pdp-aplus-active" className="relative mt-4">
        <h3 id="pdp-aplus-active" className="sr-only">
          {active.title}
        </h3>
        <div className="relative aspect-[3/2] w-full overflow-hidden rounded-xl bg-[#FDFBF7]">
          <AnimatePresence initial={false}>
            <motion.div
              key={active.id}
              className="absolute inset-0"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: dur.base, ease: ease.out }}
            >
              <Image
                src={active.src}
                alt={active.alt}
                fill
                sizes="(max-width: 1024px) 100vw, 896px"
                className="object-contain object-center"
              />
            </motion.div>
          </AnimatePresence>
        </div>
      </article>

      <div className="mt-4 flex justify-center gap-2" role="tablist" aria-label="Product highlight slides">
        {APLUS_SLIDES.map((slide, slideIndex) => (
          <button
            key={slide.id}
            type="button"
            role="tab"
            aria-selected={slideIndex === index}
            aria-label={`Show ${slide.title}`}
            onClick={() => goTo(slideIndex)}
            className={cn(
              "size-2 rounded-full transition",
              slideIndex === index ? "bg-forest" : "bg-line hover:bg-ink-muted",
            )}
          />
        ))}
      </div>
    </section>
  );
}
