import { ImagePlaceholder } from "@/components/placeholders/ImagePlaceholder";

/**
 * Product gallery strip — PRD §6.2 up to five lazy images; shown as thumb + main placeholders.
 */
export function GalleryStripSection() {
  return (
    <section className="bg-cream py-12" aria-label="Product gallery">
      <div className="mx-auto max-w-[1320px] px-5 md:px-8 lg:px-12">
        <div className="mx-auto max-w-3xl">
          <ImagePlaceholder variant="gallery" label="Gallery — lead lifestyle / pouch" />
          <div className="mt-4 flex flex-wrap justify-center gap-3">
            {[1, 2, 3, 4].map((i) => (
              <ImagePlaceholder key={i} variant="thumb" label={`Gallery thumb ${i}`} />
            ))}
          </div>
        </div>
        <div className="mx-auto mt-8 aspect-video max-w-3xl overflow-hidden rounded-xl border border-line bg-forest/5">
          <div
            className="flex h-full items-center justify-center text-body-sm text-ink-muted"
            role="note"
          >
            Video embed placeholder (YouTube / self-hosted) — lazy load in production
          </div>
        </div>
      </div>
    </section>
  );
}
