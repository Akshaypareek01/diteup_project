/**
 * Zod schemas for checkout / orders / payments.
 */
import { z } from "zod";

import { AddressBaseSchema } from "./me.js";

const ShippingForOrderSchema = AddressBaseSchema.omit({ label: true, isDefault: true });

export const CreateOrderBodySchema = z
  .object({
    items: z
      .array(
        z.object({
          variantId: z.string().min(1),
          quantity: z.number().int().positive(),
        }),
      )
      .min(1),
    paymentMethod: z.enum(["RAZORPAY", "COD"]),
    couponCode: z.string().optional(),
    guestEmail: z.string().trim().toLowerCase().email().optional(),
    guestPhone: z.string().optional(),
    idempotencyKey: z.string().max(128).optional(),
    shippingAddress: ShippingForOrderSchema.optional(),
    billingAddress: ShippingForOrderSchema.optional(),
    addressId: z.string().optional(),
  })
  .superRefine((data, ctx) => {
    if (!data.addressId && !data.shippingAddress) {
      ctx.addIssue({
        code: "custom",
        message: "Provide shippingAddress or addressId",
        path: ["shippingAddress"],
      });
    }
    if (data.addressId && data.shippingAddress) {
      ctx.addIssue({
        code: "custom",
        message: "Use either addressId or shippingAddress, not both",
        path: ["addressId"],
      });
    }
  });

export const OrderNumberParamSchema = z.object({
  orderNumber: z.string().min(6).max(48),
});

export const CancelOrderBodySchema = z.object({
  reason: z.string().max(500).optional(),
  guestToken: z.string().optional(),
});

export const GetOrderQuerySchema = z.object({
  token: z.string().optional(),
});

export const VerifyPaymentBodySchema = z.object({
  orderNumber: z.string().min(6).max(48),
  razorpay_order_id: z.string().min(1),
  razorpay_payment_id: z.string().min(1),
  razorpay_signature: z.string().min(1),
  guestToken: z.string().optional(),
});

export const MeOrdersQuerySchema = z.object({
  offset: z.coerce.number().int().min(0).optional().default(0),
  limit: z.coerce.number().int().min(1).max(50).optional().default(20),
});
