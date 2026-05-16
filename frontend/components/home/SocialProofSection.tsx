import { ImagePlaceholder } from "@/components/placeholders/ImagePlaceholder";

/**
 * Compact proof row: rating + stacked avatar placeholders.
 */
export function SocialProofSection() {
  return (
    <section className="border-b border-line bg-cream py-6" aria-label="Customer ratings">
      <div className="mx-auto flex max-w-[1320px] flex-col items-center justify-center gap-4 px-5 sm:flex-row md:px-8 lg:px-12">
        <p className="font-sans text-body-lg font-semibold text-forest">
          ★ 4.8 from 1,200+ buyers
        </p>
        <div className="flex -space-x-2" aria-hidden>
          {[1, 2, 3].map((i) => (
            <ImagePlaceholder
              key={i}
              variant="avatar"
              label={`Buyer avatar ${i}`}
              className="ring-2 ring-cream"
            />
          ))}
        </div>
      </div>
    </section>
  );
}
