"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";
import type { PublicProduct, PublicProductMedia } from "@/lib/types/catalog";

const PACKAGING_FALLBACK_SRC = "/assets/Images/product_.webp";
const SWIPE_THRESHOLD_PX = 40;

/**
 * True for seed/dev placeholder URLs that must not appear in the PDP gallery.
 */
function isPlaceholderMediaUrl(url: string): boolean {
  return /placehold\.co/i.test(url);
}

export type GallerySlide = {
  src: string;
  alt: string;
};

export type ProductImageGalleryProps = {
  product: PublicProduct;
};

/**
 * IMAGE rows only, sorted by `order`. Empty media → local packaging fallback.
 */
export function resolveGallerySlides(product: PublicProduct): GallerySlide[] {
  const rows = (product.media ?? [])
    .filter((m): m is PublicProductMedia => Boolean(m?.url))
    .filter((m) => (m.type ?? "IMAGE").toUpperCase() !== "VIDEO")
    .filter((m) => !isPlaceholderMediaUrl(m.url))
    .slice()
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  if (rows.length === 0) {
    return [{ src: PACKAGING_FALLBACK_SRC, alt: `${product.name} packaging` }];
  }

  return rows.map((m) => ({
    src: m.url,
    alt: m.altText?.trim() || product.name,
  }));
}

/**
 * Wraps gallery index into `[0, length)`.
 */
function wrapIndex(next: number, length: number): number {
  if (length <= 0) return 0;
  return ((next % length) + length) % length;
}

/**
 * PDP hero + thumbnail strip. Swipe / keyboard when more than one CMS image.
 */
export function ProductImageGallery({ product }: ProductImageGalleryProps) {
  const slides = useMemo(() => resolveGallerySlides(product), [product]);
  const fromCms = slides.some((s) => s.src !== PACKAGING_FALLBACK_SRC);
  const showThumbs = fromCms && slides.length > 1;
  const [index, setIndex] = useState(0);
  const active = slides[wrapIndex(index, slides.length)] ?? slides[0];

  const goTo = useCallback(
    (next: number) => {
      setIndex(wrapIndex(next, slides.length));
    },
    [slides.length],
  );

  useEffect(() => {
    setIndex((current) => wrapIndex(current, slides.length));
  }, [slides.length]);

  if (!active) return null;

  return (
    <div
      className="relative mx-auto mt-4 w-full max-w-[520px] lg:mx-0 lg:mt-8 lg:max-w-[480px] xl:max-w-[540px]"
      role="region"
      aria-roledescription="carousel"
      aria-label={`${product.name} images`}
      tabIndex={showThumbs ? 0 : undefined}
      onKeyDown={(e) => {
        if (!showThumbs) return;
        if (e.key === "ArrowRight") {
          e.preventDefault();
          goTo(index + 1);
        } else if (e.key === "ArrowLeft") {
          e.preventDefault();
          goTo(index - 1);
        }
      }}
    >
      {showThumbs ? (
        <p className="sr-only" aria-live="polite">
          Image {wrapIndex(index, slides.length) + 1} of {slides.length}: {active.alt}
        </p>
      ) : null}
      <HeroSlide
        slide={active}
        isLcp={index === 0}
        displayBadge={product.displayBadge}
        canSwipe={showThumbs}
        onSwipe={(dir) => goTo(index + dir)}
      />
      {showThumbs ? (
        <ThumbnailStrip
          slides={slides}
          activeIndex={wrapIndex(index, slides.length)}
          productName={product.name}
          onSelect={goTo}
        />
      ) : null}
    </div>
  );
}

type HeroSlideProps = {
  slide: GallerySlide;
  isLcp: boolean;
  displayBadge?: string | null;
  canSwipe: boolean;
  onSwipe: (direction: 1 | -1) => void;
};

/**
 * Square hero frame with optional horizontal swipe between slides.
 */
function HeroSlide({ slide, isLcp, displayBadge, canSwipe, onSwipe }: HeroSlideProps) {
  const start = useRef<{ x: number; y: number } | null>(null);

  return (
    <div
      className="relative overflow-hidden rounded-[1.125rem] border border-line/70 bg-gradient-to-b from-paper to-cream shadow-xs"
      onPointerDown={(e) => {
        if (!canSwipe) return;
        start.current = { x: e.clientX, y: e.clientY };
      }}
      onPointerUp={(e) => {
        if (!canSwipe || !start.current) return;
        const dx = e.clientX - start.current.x;
        const dy = e.clientY - start.current.y;
        start.current = null;
        if (Math.abs(dx) < SWIPE_THRESHOLD_PX || Math.abs(dx) < Math.abs(dy)) return;
        onSwipe(dx < 0 ? 1 : -1);
      }}
      onPointerCancel={() => {
        start.current = null;
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={slide.src}
        alt={slide.alt}
        fetchPriority={isLcp ? "high" : "auto"}
        decoding="async"
        loading={isLcp ? "eager" : "lazy"}
        draggable={false}
        className="aspect-square w-full select-none object-contain p-4 sm:p-8 lg:p-10"
      />
      {displayBadge ? (
        <span className="absolute left-3 top-3 rounded-md bg-[#E89B2A] px-2.5 py-1 text-body-sm font-semibold text-ink shadow-sm">
          {displayBadge}
        </span>
      ) : null}
    </div>
  );
}

type ThumbnailStripProps = {
  slides: GallerySlide[];
  activeIndex: number;
  productName: string;
  onSelect: (index: number) => void;
};

/**
 * Horizontally scrolling thumbs with a right chevron when the strip overflows.
 */
function ThumbnailStrip({ slides, activeIndex, productName, onSelect }: ThumbnailStripProps) {
  const scrollerRef = useRef<HTMLUListElement>(null);
  const [canScrollMore, setCanScrollMore] = useState(false);

  const updateOverflow = useCallback(() => {
    const el = scrollerRef.current;
    if (!el) {
      setCanScrollMore(false);
      return;
    }
    setCanScrollMore(el.scrollLeft + el.clientWidth < el.scrollWidth - 8);
  }, []);

  useEffect(() => {
    updateOverflow();
    const el = scrollerRef.current;
    if (!el) return;
    el.addEventListener("scroll", updateOverflow, { passive: true });
    window.addEventListener("resize", updateOverflow);
    return () => {
      el.removeEventListener("scroll", updateOverflow);
      window.removeEventListener("resize", updateOverflow);
    };
  }, [slides.length, updateOverflow]);

  return (
    <div className="relative mt-3">
      <ul
        ref={scrollerRef}
        className="flex gap-2 overflow-x-auto pb-1 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        role="list"
      >
        {slides.map((slide, i) => {
          const selected = i === activeIndex;
          return (
            <li key={`${slide.src}-${i}`} className="shrink-0">
              <button
                type="button"
                onClick={() => onSelect(i)}
                aria-label={`View image ${i + 1} of ${slides.length}: ${slide.alt}`}
                aria-current={selected ? "true" : undefined}
                className={cn(
                  "block h-[72px] w-[72px] overflow-hidden rounded-lg border bg-paper transition",
                  selected ? "border-forest ring-2 ring-forest/25" : "border-line/70 hover:border-forest/50",
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={slide.src}
                  alt=""
                  loading="lazy"
                  decoding="async"
                  className="h-full w-full object-contain p-1"
                />
              </button>
            </li>
          );
        })}
      </ul>
      {canScrollMore ? (
        <button
          type="button"
          aria-label={`Show more ${productName} images`}
          className="absolute inset-y-0 right-0 flex w-10 items-center justify-center rounded-r-lg bg-ink/35 text-cream backdrop-blur-[1px] transition hover:bg-ink/50"
          onClick={() => {
            scrollerRef.current?.scrollBy({ left: 168, behavior: "smooth" });
          }}
        >
          <ChevronRightIcon />
        </button>
      ) : null}
    </div>
  );
}

/**
 * White chevron used on the thumbnail overflow overlay.
 */
function ChevronRightIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M9 5l7 7-7 7"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
