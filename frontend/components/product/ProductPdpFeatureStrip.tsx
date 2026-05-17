import { cn } from "@/lib/utils";

const FEATURES = [
  {
    label: "High Protein",
    icon: (
      <svg className="size-7 sm:size-[1.85rem]" viewBox="0 0 24 24" fill="none" aria-hidden stroke="currentColor" strokeWidth="1.65">
        <circle cx="8" cy="8" r="2.15" strokeLinecap="round" />
        <circle cx="16" cy="8" r="2.15" strokeLinecap="round" />
        <circle cx="12" cy="16" r="2.15" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "Rich in Fiber",
    icon: (
      <svg className="size-7 sm:size-[1.85rem]" viewBox="0 0 24 24" fill="none" aria-hidden stroke="currentColor" strokeWidth="1.65">
        <path d="M12 3v18M8 8c0-3 2.5-5 4-5s4 2 4 5c0 4-4 7-4 7s-4-3-4-7z" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "No Added Preservatives",
    icon: (
      <svg className="size-7 sm:size-[1.85rem]" viewBox="0 0 24 24" fill="none" aria-hidden stroke="currentColor" strokeWidth="1.65">
        <path d="M9 3h6l1 7H8l1-7zM7 10h10l-1 11H8L7 10z" strokeLinejoin="round" />
        <path d="M4 20l16-16" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    label: "No Added Sugar",
    icon: (
      <svg className="size-7 sm:size-[1.85rem]" viewBox="0 0 24 24" fill="none" aria-hidden stroke="currentColor" strokeWidth="1.65">
        <rect x="6" y="11" width="5" height="5" rx="0.8" />
        <rect x="13" y="8" width="5" height="5" rx="0.8" />
        <path d="M4 20l16-16" strokeLinecap="round" />
      </svg>
    ),
  },
] as const;

export type ProductPdpFeatureStripProps = {
  className?: string;
};

/**
 * Compact benefit icons row aligned with PDP mock: graphite strokes on cream + tight caption typography.
 */
export function ProductPdpFeatureStrip({ className }: ProductPdpFeatureStripProps) {
  return (
    <section aria-label="Product highlights" className={cn(className)}>
      <ul className="grid grid-cols-4 gap-x-1.5 gap-y-4 sm:gap-x-4">
        {FEATURES.map((f) => (
          <li key={f.label} className="flex flex-col items-center gap-2 text-center">
            <span className="flex items-center justify-center text-ink-soft">{f.icon}</span>
            <span className="font-sans text-[0.6875rem] font-medium leading-snug text-ink sm:text-[0.75rem]">{f.label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
