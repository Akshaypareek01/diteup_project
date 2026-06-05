/**
 * Visual + copy tokens for order status cards on the tracking page.
 */
export type OrderStatusTone = "success" | "pending" | "cancelled" | "neutral";

/**
 * Maps backend order status to a presentation tone.
 */
export function orderStatusTone(status: string): OrderStatusTone {
  const u = status.toUpperCase();
  if (u === "CANCELLED") return "cancelled";
  if (u === "PLACED") return "pending";
  if (u === "CONFIRMED" || u === "DELIVERED" || u === "SHIPPED" || u.includes("TRANSIT")) return "success";
  return "neutral";
}

/**
 * Short supporting sentence for the prominent status card.
 */
export function orderStatusSubtitle(status: string): string {
  const u = status.toUpperCase();
  if (u === "DELIVERED") return "Your order has been delivered.";
  if (u === "PLACED") return "Payment pending — complete payment to confirm your order.";
  if (u === "CONFIRMED") return "Payment confirmed — we’ll pack it soon.";
  if (u === "SHIPPED" || u.includes("TRANSIT")) return "Your order is on the way!";
  if (u === "CANCELLED") return "This order was cancelled.";
  return "We’ll keep this page updated as your order moves.";
}

const toneCardClass: Record<OrderStatusTone, string> = {
  success: "border-success/30 bg-gradient-to-br from-success/12 via-paper to-paper",
  pending: "border-warning/35 bg-gradient-to-br from-warning/15 via-paper to-paper",
  cancelled: "border-error/30 bg-gradient-to-br from-error/10 via-paper to-paper",
  neutral: "border-line bg-paper",
};

const toneIconClass: Record<OrderStatusTone, string> = {
  success: "bg-success/20 text-success",
  pending: "bg-warning/25 text-forest",
  cancelled: "bg-error/15 text-error",
  neutral: "bg-beige text-forest",
};

/**
 * Card shell classes for the order status hero block.
 */
export function orderStatusCardClass(status: string): string {
  return toneCardClass[orderStatusTone(status)];
}

/**
 * Icon badge classes for the order status hero block.
 */
export function orderStatusIconClass(status: string): string {
  return toneIconClass[orderStatusTone(status)];
}
