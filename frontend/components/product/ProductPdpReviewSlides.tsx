"use client";

import { useCallback, useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { ReviewPhotoStrip } from "@/components/reviews/ReviewPhotoStrip";
import { parseReviewPhotos } from "@/lib/review-images";
import type { PublicReviewItem } from "@/lib/types/reviews";
import { dur, ease } from "@/lib/motion";
import { cn, getReviewAvatarInitial } from "@/lib/utils";

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

const DOT_PAGER_MAX = 7;

type ReviewSlidePagerProps = {
  count: number;
  index: number;
  onGoTo: (next: number) => void;
};

/** Left chevron for the review carousel pager. */
function PagerChevronLeft() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" fill="none" aria-hidden stroke="currentColor" strokeWidth="2">
      <path d="M15 6l-6 6 6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/** Right chevron for the review carousel pager. */
function PagerChevronRight() {
  return (
    <svg className="size-4" viewBox="0 0 24 24" fill="none" aria-hidden stroke="currentColor" strokeWidth="2">
      <path d="M9 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

const pagerBtnClass =
  "inline-flex size-9 shrink-0 items-center justify-center rounded-full border border-line bg-paper text-forest transition hover:bg-cream focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest";

/**
 * Review carousel controls: dots when there are few slides, arrows + counter when there are many.
 */
function ReviewSlidePager({ count, index, onGoTo }: ReviewSlidePagerProps) {
  if (count <= 1) return null;

  if (count <= DOT_PAGER_MAX) {
    return (
      <div className="mt-4 flex justify-center gap-2" role="tablist" aria-label="Review slides">
        {Array.from({ length: count }, (_, slideIndex) => (
          <button
            key={slideIndex}
            type="button"
            role="tab"
            aria-selected={slideIndex === index}
            aria-label={`Show review ${slideIndex + 1} of ${count}`}
            onClick={() => onGoTo(slideIndex)}
            className={cn(
              "size-2 rounded-full transition",
              slideIndex === index ? "bg-forest" : "bg-line hover:bg-ink-muted",
            )}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="mt-4 flex items-center justify-center gap-4">
      <button type="button" onClick={() => onGoTo(index - 1)} aria-label="Previous review" className={pagerBtnClass}>
        <PagerChevronLeft />
      </button>
      <p className="min-w-[4.75rem] text-center font-sans text-body-sm tabular-nums text-ink-muted" aria-hidden>
        {index + 1} / {count}
      </p>
      <button type="button" onClick={() => onGoTo(index + 1)} aria-label="Next review" className={pagerBtnClass}>
        <PagerChevronRight />
      </button>
    </div>
  );
}

export type ProductPdpReviewSlidesProps = {
  /** Real, moderated reviews from the API. When empty, the carousel renders nothing. */
  reviews: PublicReviewItem[];
  className?: string;
};

/**
 * Auto-advancing review card carousel with initials avatar, name, rating, and quote.
 * Driven entirely by real API reviews — renders nothing when there are none.
 */
export function ProductPdpReviewSlides({ reviews, className }: ProductPdpReviewSlidesProps) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const count = reviews.length;

  /** Wraps slide index for pager navigation. */
  const goTo = useCallback(
    (next: number) => {
      if (count === 0) return;
      setIndex(((next % count) + count) % count);
    },
    [count],
  );

  useEffect(() => {
    if (paused || count <= 1) return;
    const id = window.setInterval(() => {
      setIndex((current) => (current + 1) % count);
    }, SLIDER_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [paused, count]);

  useEffect(() => {
    // Keep the active index valid if the review list changes size.
    if (index >= count && count > 0) setIndex(0);
  }, [count, index]);

  if (count === 0) return null;

  const safeIndex = index % count;
  const active = reviews[safeIndex];
  const activePhotos = parseReviewPhotos(active.images);

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
        Review {safeIndex + 1} of {count} by {active.authorName}
      </p>

      <div className="relative mt-3 min-h-[16rem] overflow-hidden sm:min-h-[18rem]">
        <AnimatePresence initial={false}>
          <motion.article
            key={active.id}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: dur.base, ease: ease.out }}
            className="absolute inset-0 overflow-y-auto rounded-xl border border-line bg-cream/70 p-4 sm:p-5"
          >
            <div className="flex items-start gap-3">
              <ReviewAvatar name={active.authorName} toneIndex={safeIndex} />
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="font-semibold text-forest">{active.authorName}</p>
                  {active.isVerified ? (
                    <span className="rounded-full bg-olive/15 px-2 py-0.5 font-mono text-eyebrow text-forest">
                      Verified
                    </span>
                  ) : null}
                </div>
                <div className="mt-1.5">
                  <StarRow rating={active.rating} />
                </div>
                <p className="mt-3 line-clamp-4 text-body text-ink-soft">&ldquo;{active.body}&rdquo;</p>
                {activePhotos.length > 0 ? (
                  <ReviewPhotoStrip
                    photos={activePhotos}
                    authorName={active.authorName}
                    layout="row"
                    className="mt-3"
                  />
                ) : null}
              </div>
            </div>
          </motion.article>
        </AnimatePresence>
      </div>

      <ReviewSlidePager count={count} index={safeIndex} onGoTo={goTo} />
    </div>
  );
}
