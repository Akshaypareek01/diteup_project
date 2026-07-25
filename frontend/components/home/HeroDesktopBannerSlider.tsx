"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { HeroBannerOverlay } from "@/components/home/hero-banner-overlay";
import { dur, ease } from "@/lib/motion";

const SLIDER_INTERVAL_MS = 3000;

type DesktopSlide = {
  src: string;
  width: number;
  height: number;
  showOverlay: boolean;
  alt: string;
};

export type HeroDesktopBannerSliderProps = {
  primarySrc: string;
  shopHref: string;
};

/**
 * Auto-advancing desktop hero carousel — primary banner keeps overlay copy; artwork slides are image-only.
 */
export function HeroDesktopBannerSlider({ primarySrc, shopHref }: HeroDesktopBannerSliderProps) {
  const slides = useMemo<DesktopSlide[]>(
    () => [
      {
        src: primarySrc,
        width: 1774,
        height: 887,
        showOverlay: true,
        alt: "DiteUp clean nutrition hero",
      },
      {
        src: "/assets/Images/webbanner-slider2.webp",
        width: 1536,
        height: 1024,
        showOverlay: false,
        alt: "DiteUp Energy Bite — all-day energy and clean nutrition",
      },
    ],
    [primarySrc],
  );

  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  /** Wraps slide index for prev/next and dot navigation. */
  const goTo = useCallback(
    (next: number) => {
      setIndex(((next % slides.length) + slides.length) % slides.length);
    },
    [slides.length],
  );

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, SLIDER_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [paused, slides.length]);

  const active = slides[index];

  return (
    <div
      className="relative hidden min-h-0 w-full md:block"
      aria-roledescription="carousel"
      aria-label="Desktop hero banner slides"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) {
          setPaused(false);
        }
      }}
    >
      <div className="relative aspect-[1774/887] w-full overflow-hidden bg-[#142920]">
        <AnimatePresence initial={false}>
          <motion.div
            key={active.src}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: dur.slow, ease: ease.out }}
          >
            <Image
              src={active.src}
              alt={active.showOverlay ? "" : active.alt}
              width={active.width}
              height={active.height}
              priority={index === 0}
              sizes="(max-width: 767px) 1px, 100vw"
              role={active.showOverlay ? "presentation" : undefined}
              className="h-full w-full object-cover object-center"
            />
          </motion.div>
        </AnimatePresence>

        {active.showOverlay ? <HeroBannerOverlay shopHref={shopHref} /> : null}
      </div>

      <div
        className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2"
        role="tablist"
        aria-label="Banner slides"
      >
        {slides.map((slide, slideIndex) => (
          <button
            key={slide.src}
            type="button"
            role="tab"
            aria-selected={slideIndex === index}
            aria-label={`Show slide ${slideIndex + 1} of ${slides.length}`}
            onClick={() => goTo(slideIndex)}
            className={`size-2 rounded-full transition ${
              slideIndex === index ? "bg-gold" : "bg-cream/40 hover:bg-cream/70"
            }`}
          />
        ))}
      </div>
    </div>
  );
}
