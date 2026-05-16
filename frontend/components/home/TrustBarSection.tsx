import { IconPlaceholder } from "@/components/placeholders/IconPlaceholder";

const items = [
  "Free shipping",
  "7-day returns",
  "Secure payment",
  "24/7 support",
];

/**
 * Dark trust bar matching mockup strip.
 */
export function TrustBarSection() {
  return (
    <section className="bg-forest py-8 text-cream" aria-label="Trust and service">
      <div className="mx-auto flex max-w-[1320px] flex-wrap justify-center gap-8 px-5 md:gap-12 md:px-8 lg:px-12">
        {items.map((t) => (
          <div key={t} className="flex items-center gap-3 text-body-sm font-medium">
            <IconPlaceholder label={`${t} icon`} size="md" rounded="circle" />
            {t}
          </div>
        ))}
      </div>
    </section>
  );
}
