"use client";

import { useState } from "react";
import { ReviewPhotoStrip } from "@/components/reviews/ReviewPhotoStrip";
import type { ReviewPhoto } from "@/lib/review-images";
import { cn, formatReviewMonthYear, getReviewAvatarInitial } from "@/lib/utils";

const BODY_CLAMP_CHARS = 140;
const STAR_PATH =
  "M12 2.75 14.74 9.14h6.93l-5.61 4.06 2.13 6.59L12 16.93l-5.18 3.87 2.13-6.59L3.34 9.14h6.93L12 2.75z";

export type TestimonialSlideItem = {
  id: string;
  name: string;
  text: string;
  rating: number;
  verified: boolean;
  photos: ReviewPhoto[];
  createdAt: string;
  productName: string;
};

export type TestimonialCardProps = {
  item: TestimonialSlideItem;
  className?: string;
};

/**
 * Gold star row matching the storefront rating treatment.
 *
 * @param rating 1–5
 */
function CardStars({ rating }: { rating: number }) {
  const full = Math.round(Math.min(5, Math.max(0, rating)));
  return (
    <span className="inline-flex items-center gap-0.5 text-gold" aria-label={`${full} out of 5 stars`}>
      {Array.from({ length: 5 }, (_, index) => (
        <svg
          key={String(index)}
          className={cn("size-4", index >= full ? "text-line" : "text-gold")}
          viewBox="0 0 24 24"
          fill="currentColor"
          aria-hidden
        >
          <path d={STAR_PATH} />
        </svg>
      ))}
    </span>
  );
}

/**
 * Truncates review copy with a Read more / Read less control.
 *
 * @param text full review body
 */
function ReviewQuote({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  const needsClamp = text.length > BODY_CLAMP_CHARS;

  return (
    <div className="relative mt-4 pr-6">
      <span className="pointer-events-none absolute -right-1 -top-3 font-display text-4xl leading-none text-line" aria-hidden>
        “
      </span>
      <p className={cn("text-body italic text-ink-soft", !open && needsClamp ? "line-clamp-3" : null)}>{text}</p>
      {needsClamp ? (
        <button
          type="button"
          className="mt-1 font-sans text-body-sm font-semibold text-forest underline underline-offset-2"
          aria-expanded={open}
          onClick={() => setOpen((current) => !current)}
        >
          {open ? "Read less" : "Read more"}
        </button>
      ) : null}
    </div>
  );
}

/**
 * Home testimonial card — stars, date, quote, photo thumbs, product pill, verified footer.
 */
export function TestimonialCard({ item, className }: TestimonialCardProps) {
  const photos = item.photos ?? [];
  const monthYear = formatReviewMonthYear(item.createdAt);

  return (
    <article
      className={cn(
        "flex h-full flex-col rounded-lg border border-line bg-paper p-6 shadow-sm",
        className,
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <CardStars rating={item.rating} />
        {monthYear ? (
          <time className="text-body-sm text-ink-muted" dateTime={item.createdAt}>
            {monthYear}
          </time>
        ) : null}
      </div>

      <ReviewQuote text={item.text} />

      {photos.length > 0 ? (
        <ReviewPhotoStrip photos={photos} authorName={item.name} layout="thumbs" className="mt-4" />
      ) : null}

      <p className="mt-4 inline-flex w-fit items-center gap-1.5 rounded-full bg-olive/15 px-3 py-1 text-body-sm font-medium text-forest">
        <svg className="size-3.5 shrink-0" viewBox="0 0 24 24" fill="none" aria-hidden>
          <path
            d="M6 7h15l-1.4 8.2A2 2 0 0 1 17.63 17H8.4a2 2 0 0 1-1.97-1.67L5 4H3"
            stroke="currentColor"
            strokeWidth="1.7"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
        {item.productName}
      </p>

      <div className="mt-auto flex items-center gap-3 pt-5">
        <span
          className="inline-flex size-10 shrink-0 items-center justify-center rounded-full bg-olive/20 font-sans text-sm font-bold uppercase leading-none text-forest"
          aria-hidden
        >
          {getReviewAvatarInitial(item.name)}
        </span>
        <div className="min-w-0">
          <p className="font-semibold text-ink">{item.name}</p>
          {item.verified ? (
            <p className="mt-0.5 inline-flex items-center gap-1 text-body-sm text-success">
              <svg className="size-3.5" viewBox="0 0 24 24" fill="currentColor" aria-hidden>
                <path d="M9 12.5 10.75 14.25 15 10M12 22c5.523 0 10-4.477 10-10S17.523 2 12 2 2 6.477 2 12s4.477 10 10 10z" />
              </svg>
              Verified Buyer
            </p>
          ) : (
            <p className="mt-0.5 text-body-sm text-ink-muted">Buyer</p>
          )}
        </div>
      </div>
    </article>
  );
}
