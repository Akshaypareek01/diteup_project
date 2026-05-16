/**
 * Nutritional facts table — placeholder row labels for CMS data later.
 */
export function NutritionSection() {
  return (
    <section className="bg-paper py-14 md:py-20" aria-labelledby="nutrition-heading">
      <div className="mx-auto max-w-[680px] px-5 md:px-8 lg:px-12">
        <h2
          id="nutrition-heading"
          className="font-display text-display-md text-balance text-center font-semibold text-forest"
        >
          Nutrition (per 50g serve)
        </h2>
        <div className="mt-8 overflow-hidden rounded-lg border border-line bg-cream">
          <table className="w-full text-left text-body-sm">
            <tbody>
              {[
                ["Energy", "___ kcal"],
                ["Protein", "___ g"],
                ["Carbohydrate", "___ g"],
                ["Sugar", "___ g"],
                ["Fat", "___ g"],
                ["Fiber", "___ g"],
              ].map(([k, v]) => (
                <tr key={k} className="border-t border-line first:border-t-0">
                  <th scope="row" className="px-4 py-3 font-semibold text-forest">
                    {k}
                  </th>
                  <td className="px-4 py-3 text-ink-muted">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="mt-4 text-body-sm text-ink-muted">
          Replace with finalized panel values from packaging / lab report.
        </p>
      </div>
    </section>
  );
}
