const PERFECT_FOR: { title: string; body: string }[] = [
  {
    title: "Students",
    body: "Quick breakfast before school, college or study sessions.",
  },
  {
    title: "Office Workers",
    body: "Simple morning routine before work without cooking hassle.",
  },
  {
    title: "Gym & Fitness Users",
    body: "A clean breakfast or pre-workout meal option depending on your diet routine.",
  },
  {
    title: "Busy Moms",
    body: "Convenient breakfast support for busy mornings.",
  },
  {
    title: "Healthy Lifestyle People",
    body: "For people who prefer simple, ingredient-based breakfast options.",
  },
  {
    title: "Travel & Hostel Life",
    body: "Easy to carry and simple to prepare with water.",
  },
];

const NOT_RECOMMENDED_FOR = [
  "People allergic to peanuts, nuts, seeds.",
  "People with specific medical or dietary restrictions without consulting a healthcare professional.",
  "Small children without parental supervision, because it contains nuts and seeds.",
];

/**
 * Structured Who is this for? accordion copy for Energy Bite.
 */
export function ProductPdpWhoIsThisForContent() {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-semibold uppercase tracking-wide text-ink">Made for Busy Mornings</h3>
        <p className="mt-2">
          DiteUp Energy Bite is suitable for people who want a simple and convenient breakfast
          routine without daily measuring and preparation.
        </p>
      </div>

      <div>
        <h3 className="font-semibold uppercase tracking-wide text-ink">Perfect For</h3>
        <ul className="mt-2 list-none space-y-3" aria-label="Who DiteUp Energy Bite is perfect for">
          {PERFECT_FOR.map((item) => (
            <li key={item.title}>
              <p className="font-semibold text-ink">{item.title}</p>
              <p>{item.body}</p>
            </li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="font-semibold uppercase tracking-wide text-ink">Not Recommended For</h3>
        <ul
          className="mt-2 list-disc space-y-1 pl-5"
          aria-label="Who DiteUp Energy Bite is not recommended for"
        >
          {NOT_RECOMMENDED_FOR.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>
    </div>
  );
}
