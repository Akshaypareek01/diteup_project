import { IconPlaceholder } from "@/components/placeholders/IconPlaceholder";

const items = [
  {
    title: "100% clean ingredients",
    subtitle: "No junk — only what you can pronounce.",
    hint: "Custom SVG",
  },
  {
    title: "Easy to prepare",
    subtitle: "Open, soak overnight, eat.",
    hint: "Custom SVG",
  },
  {
    title: "Perfect nutrition",
    subtitle: "Macros balanced for busy mornings.",
    hint: "Custom SVG",
  },
  {
    title: "For everyone",
    subtitle: "Athletes, parents, desk days.",
    hint: "Custom SVG",
  },
];

/**
 * “What makes DiteUp different?” — four columns; mockup: icon + heading + sub-line.
 */
export function DiffersSection() {
  return (
    <section className="bg-cream py-14 md:py-20" aria-labelledby="diff-heading">
      <div className="mx-auto max-w-[1320px] px-5 md:px-8 lg:px-12">
        <h2
          id="diff-heading"
          className="font-display text-display-lg text-balance text-center font-semibold text-forest"
        >
          WHAT MAKES DITEUP DIFFERENT?
        </h2>
        <div className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item) => (
            <div
              key={item.title}
              className="rounded-lg border border-line bg-paper p-6 text-center shadow-sm"
            >
              <div className="mx-auto flex size-[68px] items-center justify-center rounded-full bg-beige/80">
                <IconPlaceholder label={`${item.title} — ${item.hint}`} size="xl" rounded="circle" />
              </div>
              <p className="mt-4 font-sans text-lg font-semibold uppercase tracking-wide text-forest">
                {item.title}
              </p>
              <p className="mt-2 text-body-sm text-ink-soft">{item.subtitle}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
