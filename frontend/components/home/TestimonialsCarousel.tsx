"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { TestimonialCard, type TestimonialSlideItem } from "@/components/home/TestimonialCard";
import { dur, ease } from "@/lib/motion";
import { cn } from "@/lib/utils";

const SLIDER_INTERVAL_MS = 3500;
const DESKTOP_VISIBLE_COUNT = 3;

export type { TestimonialSlideItem };

export type TestimonialsCarouselProps = {
  items: TestimonialSlideItem[];
  className?: string;
};

/**
 * Returns the next `count` testimonial items, wrapping at the end of the list.
 *
 * @param items full slide list
 * @param startIndex active index
 * @param count how many cards to show
 */
function getVisibleItems(items: TestimonialSlideItem[], startIndex: number, count: number) {
  return Array.from({ length: count }, (_, offset) => items[(startIndex + offset) % items.length]);
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

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={index}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: dur.base, ease: ease.out }}
          className="grid grid-cols-1 gap-6 md:grid-cols-3 md:items-stretch"
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

      {items.length > 1 ? (
        <div className="mt-6 flex justify-center gap-2" role="tablist" aria-label="Testimonial slides">
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
                slideIndex === index ? "bg-forest" : "bg-line hover:bg-ink-muted",
              )}
            />
          ))}
        </div>
      ) : null}
    </div>
  );
}
