const INGREDIENT_ITEMS = [
  "Chana",
  "Moong",
  "Peanut",
  "Cashew",
  "Almond",
  "Raisin",
  "Pumpkin Seeds",
  "Sunflower Seeds",
] as const;

/**
 * Structured Ingredients accordion copy for Energy Bite.
 */
export function ProductPdpIngredientsContent() {
  return (
    <div className="space-y-5">
      <p>DiteUp Energy Bite is made with a simple mix of selected ingredients:</p>
      <ul className="list-disc space-y-1 pl-5" aria-label="Ingredient list">
        {INGREDIENT_ITEMS.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <div>
        <h3 className="font-semibold uppercase tracking-wide text-ink">Allergen Information</h3>
        <p className="mt-2">
          This product contains peanuts, tree nuts, seeds. People with food allergies should read the
          ingredient list carefully before consuming.
        </p>
      </div>
      <div>
        <h3 className="font-semibold uppercase tracking-wide text-ink">Important Note</h3>
        <p className="mt-2">No added sugar. No added preservatives. No added additives.</p>
      </div>
    </div>
  );
}
