/**
 * Join class names, skipping falsy segments.
 */
export function cn(...parts: Array<string | undefined | false>): string {
  return parts.filter(Boolean).join(" ");
}

/**
 * Returns the first letter used in a review/testimonial avatar badge.
 */
export function getReviewAvatarInitial(name: string): string {
  return name.trim().charAt(0).toUpperCase() || "?";
}
