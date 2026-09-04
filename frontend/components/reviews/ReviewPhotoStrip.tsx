"use client";

import { useCallback, useEffect, useId, useState } from "react";
import type { ReviewPhoto } from "@/lib/review-images";
import { cn } from "@/lib/utils";

export type ReviewPhotoStripProps = {
  photos: ReviewPhoto[];
  authorName: string;
  /** `hero` = large still; `row` = PDP thumbs; `thumbs` = small card squares. */
  layout?: "hero" | "row" | "thumbs";
  className?: string;
};

/**
 * Review photos with a click-to-expand lightbox (Escape / backdrop close).
 */
export function ReviewPhotoStrip({
  photos,
  authorName,
  layout = "row",
  className,
}: ReviewPhotoStripProps) {
  const titleId = useId();
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const close = useCallback(() => setOpenIndex(null), []);

  useEffect(() => {
    if (openIndex == null) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [openIndex, close]);

  if (photos.length === 0) return null;

  const openPhoto = openIndex != null ? photos[openIndex] : null;

  return (
    <div className={cn(className)}>
      {layout === "hero" ? (
        <button
          type="button"
          className="block w-full overflow-hidden rounded-md bg-forest/20 text-left"
          onClick={() => setOpenIndex(0)}
          aria-label={`View photo from ${authorName}'s review`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- R2 review uploads */}
          <img
            src={photos[0]!.display}
            alt={`Photo from ${authorName}'s review`}
            className="h-36 w-full object-cover md:h-40"
          />
        </button>
      ) : (
        <ul className="flex flex-wrap gap-2" aria-label={`Photos from ${authorName}`}>
          {photos.map((photo, index) => (
            <li key={`${photo.display}-${String(index)}`}>
              <button
                type="button"
                className="overflow-hidden rounded-md border border-line bg-paper"
                onClick={() => setOpenIndex(index)}
                aria-label={`View photo ${String(index + 1)} from ${authorName}'s review`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element -- R2 review uploads */}
                <img
                  src={photo.display}
                  alt=""
                  className={layout === "thumbs" ? "size-14 object-cover sm:size-16" : "size-20 object-cover sm:size-24"}
                />
              </button>
            </li>
          ))}
        </ul>
      )}

      {openPhoto ? (
        <div className="fixed inset-0 z-[90] flex items-center justify-center p-4">
          <button
            type="button"
            className="absolute inset-0 bg-forest/55 backdrop-blur-sm"
            aria-label="Close photo"
            onClick={close}
          />
          <div
            role="dialog"
            aria-modal="true"
            aria-labelledby={titleId}
            className="relative z-10 max-h-[90vh] w-full max-w-2xl overflow-hidden rounded-2xl border border-line bg-cream p-3 shadow-lg"
          >
            <div className="flex items-center justify-between gap-3 px-1 pb-2">
              <h2 id={titleId} className="font-semibold text-forest">
                {authorName}&apos;s photo
              </h2>
              <button
                type="button"
                className="rounded-md px-2 py-1 text-body-sm font-semibold text-gold-deep hover:bg-parchment"
                onClick={close}
                aria-label="Close photo"
              >
                Close
              </button>
            </div>
            {/* eslint-disable-next-line @next/next/no-img-element -- R2 review uploads */}
            <img
              src={openPhoto.full}
              alt={`Full-size photo from ${authorName}'s review`}
              className="max-h-[75vh] w-full rounded-lg object-contain"
            />
          </div>
        </div>
      ) : null}
    </div>
  );
}
