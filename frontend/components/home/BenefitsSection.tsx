import { IconPlaceholder } from "@/components/placeholders/IconPlaceholder";
import { ImagePlaceholder } from "@/components/placeholders/ImagePlaceholder";

const items = [
  { title: "Sustained energy", subtitle: "Slow-release fuel for long mornings." },
  { title: "Better digestion", subtitle: "Fiber-forward, gut-friendly blend." },
  { title: "Muscle support", subtitle: "Plant protein from nuts & legumes." },
  { title: "No refined sugar", subtitle: "Naturally sweet from whole foods." },
];

/**
 * Cream section — mockup: benefits list + vertical product strip on larger breakpoints.
 */
export function BenefitsSection() {
  return (
    <section
      id="benefits"
      className="bg-cream py-14 md:py-20"
      aria-labelledby="benefits-heading"
    >
      <div className="mx-auto grid max-w-[1320px] items-center gap-10 px-5 md:grid-cols-[1fr_auto] md:px-8 lg:gap-14 lg:px-12">
        <div>
          <h2
            id="benefits-heading"
            className="font-display text-display-lg text-balance font-semibold text-forest md:text-left"
          >
            BUILT FOR YOUR EVERYDAY ENERGY
          </h2>
          <ul className="mt-10 space-y-4">
            {items.map((item) => (
              <li
                key={item.title}
                className="flex gap-4 rounded-lg border border-line bg-paper px-4 py-4 shadow-sm"
              >
                <IconPlaceholder label={`${item.title} icon`} size="lg" rounded="circle" />
                <div>
                  <p className="font-sans text-lg font-semibold text-forest">{item.title}</p>
                  <p className="text-body-sm text-ink-muted">{item.subtitle}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <div className="mx-auto w-full max-w-[280px] justify-self-center md:mx-0 md:justify-self-end">
          <ImagePlaceholder
            variant="strip"
            label="Vertical pack / lifestyle — benefits column"
            className="border-line-dark/30 shadow-md"
          />
        </div>
      </div>
    </section>
  );
}
