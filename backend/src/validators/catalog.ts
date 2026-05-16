/**
 * Public catalog + pincode + notify-me request schemas.
 */
import { z } from "zod";
import { isValidIndianPincode } from "../utils/format.js";

export const PincodeCheckSchema = z.object({
  pincode: z.string().trim().refine(isValidIndianPincode, "Invalid 6-digit Indian PIN code"),
  productId: z.string().min(10).optional(),
});
export type PincodeCheckInput = z.infer<typeof PincodeCheckSchema>;

export const NotifyMeSchema = z.object({
  variantId: z.string().min(10),
  email: z.string().trim().email().max(254),
  phone: z.string().trim().max(20).optional(),
});
export type NotifyMeInput = z.infer<typeof NotifyMeSchema>;

export const ProductSlugParamSchema = z.object({
  slug: z.string().min(1).max(200).regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/i, "Invalid slug"),
});
export type ProductSlugParam = z.infer<typeof ProductSlugParamSchema>;
