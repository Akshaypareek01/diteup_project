const PACK_META: { label: string; value: string }[] = [
  { label: "Serving Size", value: "1 mini sachet, 50g" },
  { label: "Servings Per Pack", value: "15" },
  { label: "Net Weight", value: "750g" },
];

const NUTRIENTS: { nutrient: string; value: string }[] = [
  { nutrient: "Energy", value: "445 kcal" },
  { nutrient: "Protein", value: "23.1 g" },
  { nutrient: "Carbohydrates", value: "40.8g" },
  { nutrient: "Total Sugar", value: "5.4 g" },
  { nutrient: "Added Sugar", value: "0g" },
  { nutrient: "Dietary Fiber", value: "11.2g" },
  { nutrient: "Total Fat", value: "18.9 g" },
  { nutrient: "Saturated Fat", value: "3.1g" },
  { nutrient: "Trans Fat", value: "0g" },
  { nutrient: "Sodium", value: "95mg" },
];

/**
 * Pack-back nutrition panel for Energy Bite (per 50g mini sachet).
 */
export function ProductPdpNutritionContent() {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="font-semibold uppercase tracking-wide text-ink">Nutrition Information</h3>
        <dl className="mt-2 space-y-1.5" aria-label="Pack serving details">
          {PACK_META.map((row) => (
            <div key={row.label} className="flex flex-wrap gap-x-2">
              <dt className="font-semibold text-ink">{row.label}:</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className="overflow-hidden rounded-md border border-line bg-paper">
        <table className="w-full text-left text-body-sm">
          <caption className="sr-only">Nutrition facts per 50g serving, 15 servings per pack</caption>
          <thead>
            <tr className="border-b border-line bg-beige/50">
              <th scope="col" className="px-3 py-2.5 font-semibold uppercase tracking-wide text-ink">
                Nutrient
              </th>
              <th scope="col" className="px-3 py-2.5 text-right font-semibold uppercase tracking-wide text-ink">
                Per Serving 50g
              </th>
            </tr>
          </thead>
          <tbody>
            {NUTRIENTS.map((row) => (
              <tr key={row.nutrient} className="border-t border-line">
                <th scope="row" className="px-3 py-2 font-medium text-ink">
                  {row.nutrient}
                </th>
                <td className="px-3 py-2 text-right tabular-nums text-ink-soft">{row.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="text-body-sm text-ink-muted">
        Nutrition values may vary slightly due to natural ingredient variations. Please refer to the product label for
        final nutrition details.
      </p>
    </div>
  );
}
