import { IconPlaceholder } from "@/components/placeholders/IconPlaceholder";
import { ImagePlaceholder } from "@/components/placeholders/ImagePlaceholder";

const ingredients = [
  "Chana",
  "Moong",
  "Peanut",
  "Almond",
  "Flax",
  "Sesame",
  "Pumpkin",
  "Sunflower",
  "Oats",
  "Dates",
];

/**
 * Mobile mockup: forest band, circular bowl, 10× ~60px ingredient chips.
 */
export function IngredientsSection() {
  return (
    <section
      id="ingredients"
      className="bg-forest py-14 text-cream md:py-20"
      aria-labelledby="ing-heading"
    >
      <div className="mx-auto max-w-[1320px] px-5 md:px-8 lg:px-12">
        <h2
          id="ing-heading"
          className="font-display text-display-lg text-balance text-center font-semibold text-cream"
        >
          10 POWERFUL INGREDIENTS. 1 PERFECT YOU.
        </h2>
        <div className="mx-auto mt-10 max-w-md">
          <div className="mx-auto w-[min(85vw,320px)] overflow-hidden rounded-full border-2 border-gold/40 shadow-lg">
            <ImagePlaceholder
              variant="gallery"
              label="Ingredient bowl — overhead"
              className="rounded-none border-0"
            />
          </div>
        </div>
        <ul className="mx-auto mt-10 grid max-w-[640px] grid-cols-5 gap-3 sm:max-w-none sm:grid-cols-5 md:grid-cols-10 md:gap-4">
          {ingredients.map((name) => (
            <li key={name} className="flex flex-col items-center gap-2 text-center">
              <span className="flex size-[68px] items-center justify-center rounded-full border border-line-dark/50 bg-sage/60">
                <IconPlaceholder label={`${name} ingredient icon`} size="xl" rounded="circle" />
              </span>
              <span className="text-body-sm font-medium text-cream/90">{name}</span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
