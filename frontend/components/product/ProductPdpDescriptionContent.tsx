const INTRO_PARAS = [
  "DiteUp Energy Bite is a pre-portioned soaked breakfast pack made for busy mornings. Each pack contains 15 mini sachets of 50g each, so you don’t need to measure, mix, or prepare multiple ingredients every day.",
  "Just open one mini pouch at night, soak it in the bowl, and enjoy it fresh in the morning.",
  "Made with a mix of chana, moong, peanuts, nuts, raisins and seeds, DiteUp Energy Bite is designed to make your breakfast routine simple, convenient and nutrition-focused.",
];

const WHY_YOULL_LOVE_IT = [
  "15 pre-portioned daily packs",
  "750g total net weight",
  "No added sugar",
  "No added preservatives",
  "No added additives",
  "High protein ingredients",
  "Rich in fiber ingredients",
  "Free bowl and spoon included",
  "Easy night-soak routine",
  "Perfect for busy mornings",
];

const PRODUCT_DETAILS: { label: string; value: string }[] = [
  { label: "Product Name", value: "DiteUp Energy Bite" },
  { label: "Net Weight", value: "750g" },
  { label: "Pack Size", value: "15 mini sachets × 50g" },
  { label: "MRP", value: "₹1099" },
  { label: "Selling Price", value: "₹799" },
  { label: "Food Type", value: "Vegetarian" },
  { label: "FSSAI Lic. No.", value: "20526004000209" },
  { label: "Included", value: "15 mini sachets + free bowl + spoon" },
  { label: "Usage", value: "Soak at night and eat in the morning" },
  { label: "Storage", value: "Store in a cool, dry place. Keep away from direct sunlight." },
];

/**
 * Structured Description accordion copy for Energy Bite.
 */
export function ProductPdpDescriptionContent() {
  return (
    <div className="space-y-5">
      <div className="space-y-3">
        {INTRO_PARAS.map((para) => (
          <p key={para.slice(0, 48)}>{para}</p>
        ))}
      </div>

      <div>
        <h3 className="font-semibold uppercase tracking-wide text-ink">Why You’ll Love It</h3>
        <ul className="mt-2 list-disc space-y-1 pl-5" aria-label="Why you’ll love DiteUp Energy Bite">
          {WHY_YOULL_LOVE_IT.map((item) => (
            <li key={item}>{item}</li>
          ))}
        </ul>
      </div>

      <div>
        <h3 className="font-semibold uppercase tracking-wide text-ink">Product Details</h3>
        <dl className="mt-2 space-y-1.5" aria-label="Product details">
          {PRODUCT_DETAILS.map((row) => (
            <div key={row.label} className="flex flex-wrap gap-x-2">
              <dt className="font-semibold text-ink">{row.label}:</dt>
              <dd>{row.value}</dd>
            </div>
          ))}
        </dl>
      </div>
    </div>
  );
}
