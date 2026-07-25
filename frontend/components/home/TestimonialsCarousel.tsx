"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { dur, ease } from "@/lib/motion";
import { cn, getReviewAvatarInitial } from "@/lib/utils";

const SLIDER_INTERVAL_MS = 3500;
const DESKTOP_VISIBLE_COUNT = 3;

export type TestimonialSlideItem = {
  id: string;
  name: string;
  text: string;
  /** Real star rating (1–5) for this review. */
  rating: number;
  verified: boolean;
};

/** Renders the review's real star count (filled) out of five. */
function CardStars({ rating }: { rating: number }) {
  const full = Math.round(Math.min(5, Math.max(0, rating)));

  return (
    <p className="mt-2 text-gold" aria-label={`${full} out of 5 stars`}>
      <span aria-hidden>
        {"★".repeat(full)}
        <span className="text-gold/30">{"★".repeat(5 - full)}</span>
      </span>
    </p>
  );
}

export type TestimonialsCarouselProps = {
  items: TestimonialSlideItem[];
  className?: string;
};

type TestimonialAvatarProps = {
  name: string;
};

type TestimonialCardProps = {
  item: TestimonialSlideItem;
  className?: string;
};

/**
 * Returns the next `count` testimonial items, wrapping at the end of the list.
 */
function getVisibleItems(items: TestimonialSlideItem[], startIndex: number, count: number) {
  return Array.from({ length: count }, (_, offset) => items[(startIndex + offset) % items.length]);
}

/** Initial badge styled for the forest testimonials band. */
function TestimonialAvatar({ name }: TestimonialAvatarProps) {
  return (
    <span
      className="inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-gold/25 font-sans text-lg font-bold uppercase leading-none text-gold ring-1 ring-gold/30"
      aria-hidden
    >
      {getReviewAvatarInitial(name)}
    </span>
  );
}

/** Single testimonial card in the home carousel row. */
function TestimonialCard({ item, className }: TestimonialCardProps) {
  return (
    <article
      className={cn(
        "flex h-full flex-col rounded-lg border border-line-dark/50 bg-sage/80 p-6 shadow-sm backdrop-blur-sm",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <TestimonialAvatar name={item.name} />
        <div>
          <p className="font-semibold text-cream">{item.name}</p>
          <p className="text-body-sm text-cream/70">{item.verified ? "Verified buyer" : "Buyer"}</p>
        </div>
      </div>
      <p className="mt-4 text-body text-cream/85">&ldquo;{item.text}&rdquo;</p>
      <CardStars rating={item.rating} />
    </article>
  );
}

/**
 * Auto-advancing testimonial carousel — one card on mobile, three in a row on desktop.
 */
export function TestimonialsCarousel({ items, className }: TestimonialsCarouselProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  /** Wraps slide index for dot navigation. */
  const goTo = useCallback(
    (next: number) => {
      setIndex(((next % items.length) + items.length) % items.length);
    },
    [items.length],
  );

  useEffect(() => {
    if (paused || items.length <= 1) return;
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % items.length);
    }, SLIDER_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [paused, items.length]);

  if (items.length === 0) return null;

  const visibleItems = getVisibleItems(items, index, DESKTOP_VISIBLE_COUNT);
  const active = items[index];

  return (
    <div
      className={cn("mt-10 w-full", className)}
      aria-roledescription="carousel"
      aria-label="Customer testimonials"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) {
          setPaused(false);
        }
      }}
    >
      <p className="sr-only" aria-live="polite">
        Showing testimonials starting with {active.name}, slide {index + 1} of {items.length}
      </p>

      <div className="relative min-h-[15rem] overflow-hidden md:min-h-[17rem]">
        <AnimatePresence initial={false}>
          <motion.div
            key={index}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: dur.base, ease: ease.out }}
            className="absolute inset-0 grid grid-cols-1 gap-6 md:grid-cols-3 md:items-stretch"
          >
            {visibleItems.map((item, itemIndex) => (
              <TestimonialCard
                key={`${item.id}-${String(index)}`}
                item={item}
                className={itemIndex > 0 ? "hidden md:flex" : undefined}
              />
            ))}
          </motion.div>
        </AnimatePresence>
      </div>

      {items.length > 1 ? (
        <div className="mt-5 flex justify-center gap-2" role="tablist" aria-label="Testimonial slides">
          {items.map((item, slideIndex) => (
            <button
              key={item.id}
              type="button"
              role="tab"
              aria-selected={slideIndex === index}
              aria-label={`Show testimonial by ${item.name}`}
              onClick={() => goTo(slideIndex)}
              className={cn(
                "size-2 rounded-full transition",
                slideIndex === index ? "bg-gold" : "bg-cream/30 hover:bg-cream/50",
              )}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
