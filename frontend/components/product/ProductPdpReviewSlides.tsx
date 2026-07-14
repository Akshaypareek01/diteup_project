"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  getReviewAvatarInitial,
  PDP_MOCK_REVIEW_CARDS,
} from "@/lib/pdp-mock-reviews";
import { dur, ease } from "@/lib/motion";
import { cn } from "@/lib/utils";

const SLIDER_INTERVAL_MS = 3500;

/** Avatar tones live in this file so Tailwind always emits the solid bg utilities. */
const REVIEW_AVATAR_STYLES = [
  "bg-forest text-cream",
  "bg-sage text-cream",
  "bg-gold text-forest",
  "bg-olive text-cream",
] as const;

type ReviewAvatarProps = {
  name: string;
  toneIndex: number;
};

/** Circular initial badge for a review card. */
function ReviewAvatar({ name, toneIndex }: ReviewAvatarProps) {
  const tone = REVIEW_AVATAR_STYLES[toneIndex % REVIEW_AVATAR_STYLES.length];

  return (
    <span
      className={cn(
        "inline-flex size-11 shrink-0 items-center justify-center rounded-full font-sans text-base font-bold uppercase leading-none ring-1 ring-forest/15",
        tone,
      )}
      aria-hidden
    >
      {getReviewAvatarInitial(name)}
    </span>
  );
}

type StarRowProps = {
  rating: number;
};

/** Compact five-star display for review cards. */
function StarRow({ rating }: StarRowProps) {
  const full = Math.round(Math.min(5, Math.max(0, rating)));
  const empty = Math.max(0, 5 - full);
  const starPath =
    "M12 2.75 14.74 9.14h6.93l-5.61 4.06 2.13 6.59L12 16.93l-5.18 3.87 2.13-6.59L3.34 9.14h6.93L12 2.75z";

  return (
    <span
      className="inline-flex items-center gap-0.5 text-gold-deep"
      aria-label={`${rating.toFixed(1)} out of 5 stars`}
    >
      {Array.from({ length: full }, (_, index) => (
        <svg key={`full-${String(index)}`} className="size-4" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
          <path d={starPath} />
        </svg>
      ))}
      {Array.from({ length: empty }, (_, index) => (
        <svg
          key={`empty-${String(index)}`}
          className="size-4 text-line-dark/35"
          viewBox="0 0 24 24"
          fill="none"
          aria-hidden
        >
          <path d={starPath} stroke="currentColor" strokeWidth="1.45" />
        </svg>
      ))}
    </span>
  );
}

export type ProductPdpReviewSlidesProps = {
  className?: string;
};

/**
 * Auto-advancing review card carousel with initials avatar, name, rating, and quote.
 */
export function ProductPdpReviewSlides({ className }: ProductPdpReviewSlidesProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  /** Wraps slide index for dot navigation. */
  const goTo = useCallback((next: number) => {
    setIndex(((next % PDP_MOCK_REVIEW_CARDS.length) + PDP_MOCK_REVIEW_CARDS.length) % PDP_MOCK_REVIEW_CARDS.length);
  }, []);

  useEffect(() => {
    if (paused) return;
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % PDP_MOCK_REVIEW_CARDS.length);
    }, SLIDER_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [paused]);

  const active = PDP_MOCK_REVIEW_CARDS[index];

  return (
    <div
      className={cn(className)}
      aria-roledescription="carousel"
      aria-label="Customer review highlights"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget as Node)) {
          setPaused(false);
        }
      }}
    >
      <h3 className="font-sans text-body-sm font-medium text-ink-muted">What customers are saying</h3>
      <p className="sr-only" aria-live="polite">
        Review {index + 1} of {PDP_MOCK_REVIEW_CARDS.length} by {active.name}
      </p>

      <div className="relative mt-3 min-h-[11.5rem] overflow-hidden sm:min-h-[10.5rem]">
        <AnimatePresence initial={false}>
          <motion.article
            key={active.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: dur.base, ease: ease.out }}
            className="absolute inset-0 rounded-xl border border-line bg-cream/70 p-4 sm:p-5"
          >
            <div className="flex items-start gap-3">
              <ReviewAvatar name={active.name} toneIndex={index} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-forest">{active.name}</p>
                  <span className="rounded-full bg-olive/15 px-2 py-0.5 font-mono text-eyebrow text-forest">
                    Verified
                  </span>
                </div>
                <div className="mt-1.5">
                  <StarRow rating={active.rating} />
                </div>
                <p className="mt-3 text-body text-ink-soft">&ldquo;{active.body}&rdquo;</p>
              </div>
            </div>
          </motion.article>
        </AnimatePresence>
      </div>

      <div className="mt-4 flex justify-center gap-2" role="tablist" aria-label="Review slides">
        {PDP_MOCK_REVIEW_CARDS.map((review, slideIndex) => (
          <button
            key={review.id}
            type="button"
            role="tab"
            aria-selected={slideIndex === index}
            aria-label={`Show review by ${review.name}`}
            onClick={() => goTo(slideIndex)}
            className={cn(
              "size-2 rounded-full transition",
              slideIndex === index ? "bg-forest" : "bg-line hover:bg-ink-muted",
            )}
          />
        ))}
      </div>
    </div>
  );
}
