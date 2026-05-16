/**
 * Zod request schemas for /v1/me/* endpoints.
 */
import { z } from "zod";
import { isValidIndianPincode, normalizeIndianPhone } from "../utils/format.js";

const PhoneIN = z.string().min(10).max(20).transform((v, ctx) => {
  try {
    return normalizeIndianPhone(v);
  } catch (err) {
    ctx.addIssue({
      code: "custom",
      message: err instanceof Error ? err.message : "Invalid phone",
    });
    return z.NEVER;
  }
});

const Pincode = z.string().refine(isValidIndianPincode, "Invalid 6-digit Indian PIN code");

// ---- Profile ----
export const UpdateProfileSchema = z.object({
  /** Empty string clears the stored name (same as `null`). */
  name: z.string().trim().max(120).nullable().optional(),
  phone: PhoneIN.optional().nullable(),
  gender: z.enum(["MALE", "FEMALE", "OTHER", "PREFER_NOT_TO_SAY"]).optional(),
  dateOfBirth: z
    .string()
    .datetime({ offset: true })
    .or(z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Invalid date"))
    .optional()
    .nullable()
    .transform((v) => (v ? new Date(v) : v)),
  marketingOptIn: z.boolean().optional(),
});
export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;

const OtpSixDigits = z.string().regex(/^\d{6}$/, "OTP must be 6 digits");

/**
 * Email change: request → code to new address → code to old address (PRD §16 #75).
 */
export const EmailChangeSchema = z.discriminatedUnion("phase", [
  z.object({
    phase: z.literal("request"),
    newEmail: z.string().trim().toLowerCase().email().max(254),
    currentPassword: z.string().min(1).max(72),
  }),
  z.object({
    phase: z.literal("verify_new"),
    newEmail: z.string().trim().toLowerCase().email().max(254),
    code: OtpSixDigits,
  }),
  z.object({
    phase: z.literal("verify_old"),
    newEmail: z.string().trim().toLowerCase().email().max(254),
    code: OtpSixDigits,
  }),
]);
export type EmailChangeInput = z.infer<typeof EmailChangeSchema>;

// ---- Addresses ----
export const AddressBaseSchema = z.object({
  label: z.string().max(40).optional(),
  name: z.string().trim().min(1).max(120),
  phone: PhoneIN,
  line1: z.string().trim().min(3).max(255),
  line2: z.string().trim().max(255).optional(),
  city: z.string().trim().min(1).max(80),
  state: z.string().trim().min(1).max(80),
  pincode: Pincode,
  country: z.string().trim().length(2).default("IN"),
  isDefault: z.boolean().optional().default(false),
});
export type AddressInput = z.infer<typeof AddressBaseSchema>;

export const AddressUpdateSchema = AddressBaseSchema.partial().refine(
  (val) => Object.keys(val).length > 0,
  "Provide at least one field to update",
);
export type AddressUpdateInput = z.infer<typeof AddressUpdateSchema>;

export const AddressIdParamSchema = z.object({
  id: z.string().min(10),
});

// ---- Avatar upload ----
export const AvatarUploadUrlSchema = z.object({
  contentType: z.enum([
    "image/jpeg",
    "image/png",
    "image/webp",
  ]),
  sizeBytes: z.coerce.number().int().positive().max(10 * 1024 * 1024), // 10MB
});
export type AvatarUploadUrlInput = z.infer<typeof AvatarUploadUrlSchema>;

export const AvatarConfirmSchema = z.object({
  /** Public read URL returned from the presign step (R2 path-style or CDN). */
  publicUrl: z.string().url().max(2048),
  /** S3 object key, e.g. `avatars/{userId}/{uuid}.jpg` */
  key: z.string().min(8).max(512),
});
export type AvatarConfirmInput = z.infer<typeof AvatarConfirmSchema>;

// ---- Account deletion ----
export const DeleteAccountSchema = z.object({
  currentPassword: z.string().min(1).max(72),
  reason: z.string().max(500).optional(),
  // Belt-and-braces confirmation phrase
  confirm: z.literal("DELETE MY ACCOUNT"),
});
export type DeleteAccountInput = z.infer<typeof DeleteAccountSchema>;
