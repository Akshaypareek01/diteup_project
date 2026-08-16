const NIGHT_ROUTINE_STEPS: { title: string; body: string }[] = [
  { title: "Step 1: Open", body: "Take one mini sachet of DiteUp Energy Bite." },
  { title: "Step 2: Pour", body: "Pour the mix into the bowl provided inside the pack." },
  {
    title: "Step 3: Add Water",
    body: "Add clean drinking water until the mix is properly covered.",
  },
  { title: "Step 4: Soak Overnight", body: "Keep it soaked overnight." },
  {
    title: "Step 5: Eat in the Morning",
    body: "Enjoy it fresh in the morning with the spoon provided.",
  },
];

const BEST_TIMES = [
  "Morning breakfast",
  "Before office or college",
  "Before workout, as per your diet routine",
  "During busy mornings when you don’t want to prepare breakfast from scratch",
];

/**
 * Structured How to use accordion copy for Energy Bite.
 */
export function ProductPdpHowToUseContent() {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-semibold uppercase tracking-wide text-ink">Simple Night Routine</h3>
        <ol className="mt-2 list-none space-y-3" aria-label="Simple night routine steps">
          {NIGHT_ROUTINE_STEPS.map((step) => (
            <li key={step.title}>
              <p className="font-semibold text-ink">{step.title}</p>
              <p>{step.body}</p>
            </li>
          ))}
        </ol>
      </div>

      <div>
        <h3 className="font-semibold uppercase tracking-wide text-ink">Best Time to Use</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5" aria-label="Best times to use DiteUp Energy Bite">
          {BEST_TIMES.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="font-semibold uppercase tracking-wide text-ink">Important</h3>
        <p className="mt-2">
          For best taste and texture, we recommend soaking it overnight before eating.
        </p>
      </div>
    </div>
  );
}
