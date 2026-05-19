import Image from "next/image";

/**
 * Home “what’s inside” band: responsive artwork centered in the content column (not full bleed).
 */
export function IngredientsSection() {
  return (
    <section
      id="ingredients"
      className="scroll-mt-[104px] bg-cream py-10 md:py-14"
      aria-labelledby="ing-heading"
    >
      <div className="mx-auto max-w-[1320px] px-5 md:px-8 lg:px-12">
        <h2 id="ing-heading" className="sr-only">
          What&apos;s inside: ten powerful ingredients — chickpeas, moong, peanuts, almonds,
          cashews, oats, citrus, pumpkin seeds, chia seeds, and supporting ingredients.
        </h2>
        <figure className="mx-auto w-full max-w-[min(100%,22rem)] sm:max-w-md md:hidden">
          <Image
            src="/assets/Images/whatinside_mobile.png"
            alt=""
            width={1536}
            height={1024}
            sizes="(max-width: 767px) min(352px, 100vw), 0px"
            className="h-auto w-full"
          />
        </figure>
        <figure className="mx-auto hidden w-full max-w-3xl md:block lg:max-w-4xl">
          <Image
            src="/assets/Images/ingredients_desktop.png"
            alt=""
            width={1536}
            height={1024}
            sizes="(min-width: 1024px) 896px, (min-width: 768px) 768px, 0px"
            className="h-auto w-full"
          />
        </figure>
      </div>
    </section>
  );
}
