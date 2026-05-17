import type { ReactNode } from "react";

export type PolicySectionProps = {
  id: string;
  title: string;
  body: ReactNode;
};

/**
 * Accessible policy subsection with stable id for deep links and aria-labelledby.
 */
export function PolicySection({ id, title, body }: PolicySectionProps) {
  return (
    <section className="mt-10 scroll-mt-24" aria-labelledby={id}>
      <h2 id={id} className="font-display text-display-md font-semibold text-forest">
        {title}
      </h2>
      <div className="mt-4 space-y-4 text-body text-ink leading-relaxed">{body}</div>
    </section>
  );
}
