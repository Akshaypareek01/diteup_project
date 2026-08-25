/**
 * Zod schemas for checkout / orders / payments.
 */
import { z } from "zod";

import { AddressBaseSchema } from "./me.js";

const ShippingForOrderSchema = AddressBaseSchema.omit({ label: true, isDefault: true });

/**
 * Optional Meta ad-attribution signal.
 *
 * `.catch` is deliberate: these come from browser cookies we do not control, and an
 * oversized or malformed value must degrade to "no attribution" rather than reject the
 * order. Analytics must never block a sale.
 */
const MetaSignalSchema = z.string().max(256).optional().catch(undefined);

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
    /** Meta `_fbp` cookie — replayed by the Conversions API at confirmation. */
    fbp: MetaSignalSchema,
    /** Meta `_fbc` click cookie, or one derived from an `fbclid` URL parameter. */
    fbc: MetaSignalSchema,
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
