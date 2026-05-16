/**
 * Request schemas for coupon validation + cart preview.
 */
import { z } from "zod";

export const CouponValidateBodySchema = z.object({
  code: z.string().trim().min(1).max(64),
  subtotal: z.coerce.number().nonnegative(),
  paymentMethod: z.enum(["RAZORPAY", "COD"]).default("RAZORPAY"),
  guestEmail: z.string().trim().email().max(254).optional(),
  /**
   * Optional shipping quote before coupon — enables FREE_SHIPPING “already free” detection (PRD §16 #47).
   */
  shippingBeforeDiscount: z.coerce.number().nonnegative().optional(),
});
export type CouponValidateBody = z.infer<typeof CouponValidateBodySchema>;

export const CartPreviewBodySchema = z.object({
  items: z
    .array(
      z.object({
        variantId: z.string().min(10),
        quantity: z.coerce.number().int().positive(),
      }),
    )
    .min(1)
    .max(50),
  couponCode: z.string().trim().max(64).optional().nullable(),
  paymentMethod: z.enum(["RAZORPAY", "COD"]).default("RAZORPAY"),
  guestEmail: z.string().trim().email().max(254).optional(),
});
export type CartPreviewBody = z.infer<typeof CartPreviewBodySchema>;
