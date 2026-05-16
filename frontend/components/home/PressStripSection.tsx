import { ImagePlaceholder } from "@/components/placeholders/ImagePlaceholder";

const press = ["Mid-day", "Healthshots", "Fitness", "India Today", "Times of India"];

/**
 * Press logo strip — grayscale logo placeholders sized per partner lockup.
 */
export function PressStripSection() {
  return (
    <section
      className="border-y border-line bg-beige/90 py-10"
      aria-label="As seen in"
    >
      <div className="mx-auto flex max-w-[1320px] flex-wrap items-center justify-center gap-6 px-5 md:gap-10 md:px-8 lg:px-12">
        {press.map((name) => (
          <ImagePlaceholder
            key={name}
            variant="logo"
            label={`Logo — ${name}`}
            className="grayscale opacity-80"
          />
        ))}
      </div>
    </section>
  );
}
