"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { AnimatePresence, motion } from "framer-motion";
import { HeroBannerOverlay } from "@/components/home/hero-banner-overlay";
import { dur, ease } from "@/lib/motion";
import { cn } from "@/lib/utils";

const SLIDER_INTERVAL_MS = 3000;

export type HeroDesktopSlide = {
  src: string;
  width: number;
  height: number;
  alt: string;
  href?: string | null;
  showOverlay?: boolean;
};

export type HeroDesktopBannerSliderProps = {
  slides: HeroDesktopSlide[];
  shopHref: string;
  /** `cover` = framed crop; `natural` = intrinsic image height. */
  layout?: "cover" | "natural";
  /** Tailwind aspect class when `layout="cover"`. Defaults to desktop 1774/887. */
  aspectClass?: string;
  className?: string;
  sizes: string;
  ariaLabel: string;
};

/**
 * True when the banner URL is remote (R2/CMS) and cannot use `next/image` without remotePatterns.
 */
function isRemoteSrc(src: string): boolean {
  return src.startsWith("http://") || src.startsWith("https://");
}

/**
 * Auto-advancing hero carousel. CMS slides wrap in the admin link; overlay copy is fallback-only.
 */
export function HeroDesktopBannerSlider({
  slides,
  shopHref,
  layout = "cover",
  aspectClass = "aspect-[1774/887]",
  className,
  sizes,
  ariaLabel,
}: HeroDesktopBannerSliderProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const multi = slides.length > 1;

  const goTo = useCallback(
    (next: number) => {
      if (slides.length === 0) return;
      setIndex(((next % slides.length) + slides.length) % slides.length);
    },
    [slides.length],
  );

  useEffect(() => {
    setIndex((current) => (slides.length ? current % slides.length : 0));
  }, [slides.length]);

  useEffect(() => {
    if (paused || !multi) return;
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % slides.length);
    }, SLIDER_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [paused, multi, slides.length]);

  const active = slides[index];
  if (!active) return null;

  return (
    <div
      className={cn("relative min-h-0 w-full", className)}
      aria-roledescription="carousel"
      aria-label={ariaLabel}
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) {
          setPaused(false);
        }
      }}
    >
      <div
        className={cn(
          "relative w-full overflow-hidden bg-[#142920]",
          layout === "cover" ? aspectClass : "",
        )}
      >
        <AnimatePresence initial={false}>
          <motion.div
            key={`${active.src}-${index}`}
            className={layout === "cover" ? "absolute inset-0" : "relative"}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: dur.slow, ease: ease.out }}
          >
            <BannerSlideArt slide={active} priority={index === 0} sizes={sizes} layout={layout} />
          </motion.div>
        </AnimatePresence>

        {active.showOverlay ? <HeroBannerOverlay shopHref={shopHref} /> : null}
      </div>

      {multi ? (
        <div
          className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-2"
          role="tablist"
          aria-label="Banner slides"
        >
          {slides.map((slide, slideIndex) => (
            <button
              key={`${slide.src}-${slideIndex}`}
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
      ) : null}
    </div>
  );
}

type BannerSlideArtProps = {
  slide: HeroDesktopSlide;
  priority: boolean;
  sizes: string;
  layout: "cover" | "natural";
};

/**
 * Renders one slide image; wraps in an anchor when `href` is set and overlay is off.
 */
function BannerSlideArt({ slide, priority, sizes, layout }: BannerSlideArtProps) {
  const imgClass =
    layout === "cover" ? "h-full w-full object-cover object-center" : "h-auto w-full object-cover object-center";
  const clickable = Boolean(slide.href) && !slide.showOverlay;
  const img = isRemoteSrc(slide.src) ? (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={slide.src}
      alt={slide.showOverlay ? "" : slide.alt}
      width={slide.width}
      height={slide.height}
      fetchPriority={priority ? "high" : "auto"}
      decoding="async"
      role={slide.showOverlay ? "presentation" : undefined}
      className={imgClass}
    />
  ) : (
    <Image
      src={slide.src}
      alt={slide.showOverlay ? "" : slide.alt}
      width={slide.width}
      height={slide.height}
      priority={priority}
      sizes={sizes}
      role={slide.showOverlay ? "presentation" : undefined}
      className={imgClass}
    />
  );

  if (!clickable || !slide.href) return img;

  return (
    <a href={slide.href} className={layout === "cover" ? "absolute inset-0 block" : "block"} aria-label={slide.alt || "Open banner"}>
      {img}
    </a>
  );
}
