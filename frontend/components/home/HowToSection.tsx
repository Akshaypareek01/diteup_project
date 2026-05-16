import { ImagePlaceholder } from "@/components/placeholders/ImagePlaceholder";

const steps = [
  { title: "Open", detail: "Tear the single-serve pack." },
  { title: "Soak", detail: "Add milk or water overnight." },
  { title: "Eat", detail: "Top with fruit; dig in." },
];

/**
 * Cream how-to — mockup: numbered steps with circular art.
 */
export function HowToSection() {
  return (
    <section className="bg-cream py-14 text-forest md:py-20" aria-labelledby="how-heading">
      <div className="mx-auto max-w-[1320px] px-5 md:px-8 lg:px-12">
        <h2
          id="how-heading"
          className="font-display text-display-lg text-balance text-center font-semibold text-forest"
        >
          EASY TO PREPARE. EASY TO LOVE.
        </h2>
        <ol className="mt-12 grid gap-10 md:grid-cols-3">
          {steps.map((s, i) => (
            <li key={s.title} className="text-center">
              <div className="mx-auto w-[min(56vw,200px)]">
                <ImagePlaceholder
                  variant="gallery"
                  label={`Step ${i + 1} — ${s.title} illustration`}
                  className="rounded-full border-2 border-gold/50"
                />
              </div>
              <p className="mt-4 font-sans text-eyebrow text-gold-deep">
                {i + 1}. {s.title}
              </p>
              <p className="mt-2 text-body-sm text-ink-soft">{s.detail}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
