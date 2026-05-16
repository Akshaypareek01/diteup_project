import { ImagePlaceholder } from "@/components/placeholders/ImagePlaceholder";

/**
 * Story block — forest band with supporting lifestyle image placeholder.
 */
export function StorySection() {
  return (
    <section
      id="about"
      className="bg-forest py-14 text-cream md:py-20"
      aria-labelledby="about-heading"
    >
      <div className="mx-auto grid max-w-[1080px] gap-10 px-5 md:grid-cols-2 md:items-center md:px-8 lg:px-12">
        <div>
          <h2
            id="about-heading"
            className="font-display text-display-lg text-balance font-semibold"
          >
            Soak at night. Eat in morning.
          </h2>
          <p className="mt-4 text-body-lg text-cream/85">
            Night → morning narrative photography and optional gradient scene
            (Three.js deferred per DESIGN-SYSTEM §9).
          </p>
        </div>
        <ImagePlaceholder
          variant="card"
          label="Story — bowl / dawn lifestyle"
          className="border-line-dark/40"
        />
      </div>
    </section>
  );
}
