/**
 * Thin Razorpay Orders API wrapper (PRD §9).
 */
import Razorpay from "razorpay";

import { env } from "../config/env.js";
import { ServiceUnavailable } from "../utils/errors.js";

export function isRazorpayConfigured(): boolean {
  return Boolean(env.RAZORPAY_KEY_ID && env.RAZORPAY_KEY_SECRET);
}

/**
 * Returns a configured client or throws 503 when keys are missing.
 */
export function getRazorpayClient(): Razorpay {
  if (!isRazorpayConfigured()) {
    throw ServiceUnavailable("Online payments are not configured");
  }
  return new Razorpay({
    key_id: env.RAZORPAY_KEY_ID!,
    key_secret: env.RAZORPAY_KEY_SECRET!,
  });
}

/** Razorpay key id for Checkout.js — safe to expose to browser. */
export function getRazorpayKeyId(): string {
  if (!env.RAZORPAY_KEY_ID) {
    throw ServiceUnavailable("Online payments are not configured");
  }
  return env.RAZORPAY_KEY_ID;
}

export type CreatedRzpOrder = {
  id: string;
  amount: number;
  currency: string;
};

/**
 * Creates a Razorpay Order. `amount` is in **paise** (₹ × 100), minimum 100 (₹1).
 */
export async function createRazorpayOrder(args: {
  amountPaise: number;
  receipt: string;
  notes?: Record<string, string>;
}): Promise<CreatedRzpOrder> {
  const rzp = getRazorpayClient();
  const receipt = args.receipt.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40);
  const order = (await rzp.orders.create({
    amount: args.amountPaise,
    currency: "INR",
    receipt: receipt || "DITEUP",
    notes: args.notes,
  })) as { id: string; amount: number; currency: string };
  return { id: order.id, amount: order.amount, currency: order.currency };
}

export type RazorpayRefundResult = {
  id: string;
  amount: number;
  status: string;
};

/**
 * Creates a Razorpay payment refund. Omit `amountPaise` for a full refund.
 */
export async function refundRazorpayPayment(args: {
  razorpayPaymentId: string;
  amountPaise?: number;
  notes?: Record<string, string>;
}): Promise<RazorpayRefundResult> {
  const rzp = getRazorpayClient();
  const payload: { amount?: number; notes?: Record<string, string> } = {};
  if (args.amountPaise != null) payload.amount = args.amountPaise;
  if (args.notes) payload.notes = args.notes;
  const refund = (await rzp.payments.refund(args.razorpayPaymentId, payload)) as {
    id: string;
    amount: number;
    status: string;
  };
  return { id: refund.id, amount: refund.amount, status: refund.status };
}
