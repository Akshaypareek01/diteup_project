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

/**
 * Formats a review timestamp as `Aug 2026` for testimonial cards.
 *
 * @param iso ISO date string from the reviews API
 */
export function formatReviewMonthYear(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "";
  return date.toLocaleDateString("en-IN", { month: "short", year: "numeric", timeZone: "Asia/Kolkata" });
}
