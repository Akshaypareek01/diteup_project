import { ENERGY_BITE_FAQ_ITEMS } from "@/lib/energy-bite-faqs";

/**
 * Full Energy Bite FAQ list for the PDP accordion.
 */
export function ProductPdpFaqContent() {
  return (
    <dl className="space-y-4" aria-label="Frequently asked questions">
      {ENERGY_BITE_FAQ_ITEMS.map((item) => (
        <div key={item.question}>
          <dt className="font-semibold text-forest">{item.question}</dt>
          <dd className="mt-1">{item.answer}</dd>
        </div>
      ))}
    </dl>
  );
}
