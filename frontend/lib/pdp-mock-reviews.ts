/** Static mock review card shown in the PDP review carousel. */
export type PdpMockReviewCard = {
  id: string;
  name: string;
  rating: number;
  body: string;
};

/** Curated buyer-style quotes with varied star ratings for the PDP slider. */
export const PDP_MOCK_REVIEW_CARDS: PdpMockReviewCard[] = [
  {
    id: "review-1",
    name: "Ananya R.",
    rating: 5,
    body: "Perfect for busy mornings — soak at night and breakfast is ready. Clean taste, no junk.",
  },
  {
    id: "review-2",
    name: "Karan V.",
    rating: 4,
    body: "Good crunch and keeps me full till lunch. The 750g pack lasts well for the family.",
  },
  {
    id: "review-3",
    name: "Meera P.",
    rating: 5,
    body: "Love that there is no added sugar. My kids enjoy it with milk on weekends too.",
  },
  {
    id: "review-4",
    name: "Rohit S.",
    rating: 5,
    body: "High protein snack that actually feels natural. Great before gym or long work days.",
  },
  {
    id: "review-5",
    name: "Divya K.",
    rating: 4,
    body: "Shipping was quick and packaging feels premium. Will reorder once this pack finishes.",
  },
  {
    id: "review-6",
    name: "Arjun M.",
    rating: 5,
    body: "Finally a desi mix I trust — nuts, seeds, and legumes without weird additives.",
  },
  {
    id: "review-7",
    name: "Sneha T.",
    rating: 4,
    body: "Easy to digest and not too heavy. The bowl and spoon in the box were a nice touch.",
  },
  {
    id: "review-8",
    name: "Vikram J.",
    rating: 5,
    body: "Steady energy through the morning without a sugar crash. Highly recommend for office goers.",
  },
];

/**
 * Returns the first letter used in the review card avatar.
 */
export function getReviewAvatarInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "?";
}
