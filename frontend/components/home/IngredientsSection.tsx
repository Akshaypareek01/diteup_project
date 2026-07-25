import Image from "next/image";

/**
 * Full-width "What's inside" marketing banner — artwork includes headline and ingredient breakdown.
 */
export function IngredientsSection() {
  return (
    <section
      id="ingredients"
      className="scroll-mt-[104px] bg-cream"
      aria-label="What's inside — 8 powerful ingredients in one perfect mix"
    >
      <div className="mx-auto w-full">
        <Image
          src="/assets/Images/whatinsideiamgeweb.webp"
          alt="What's inside DiteUp Energy Bite — 8 powerful ingredients including chana, peanut, moong, cashew, almond, raisin, pumpkin seeds, and sunflower seeds"
          width={1672}
          height={941}
          sizes="100vw"
          className="h-auto w-full object-contain object-center"
        />
      </div>
    </section>
  );
}
