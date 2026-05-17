import Image from "next/image";

/**
 * Home “what’s inside” band: artwork spans the content column width; height follows intrinsic aspect ratio (no fixed-height crop boxes).
 */
export function IngredientsSection() {
  return (
    <section
      id="ingredients"
      className="scroll-mt-[104px] bg-cream"
      aria-labelledby="ing-heading"
    >
      <div className="mx-auto max-w-[1320px] px-4 md:px-6 lg:px-8">
        <h2 id="ing-heading" className="sr-only">
          What&apos;s inside: ten powerful ingredients — chickpeas, moong, peanuts, almonds,
          cashews, oats, citrus, pumpkin seeds, chia seeds, and supporting ingredients.
        </h2>
        <Image
          src="/assets/Images/whatinside_mobile.png"
          alt=""
          width={1536}
          height={1024}
          sizes="100vw"
          className="h-auto w-full md:hidden"
        />
        <Image
          src="/assets/Images/ingredients_desktop.png"
          alt=""
          width={1536}
          height={1024}
          sizes="(min-width: 768px) min(1320px, 100vw), 100vw"
          className="hidden h-auto w-full md:block"
        />
      </div>
    </section>
  );
}
