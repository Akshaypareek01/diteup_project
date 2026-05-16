/**
 * Zod request schemas for /v1/auth/* endpoints.
 */
import { z } from "zod";

const Email = z
  .string()
  .trim()
  .toLowerCase()
  .email({ message: "Invalid email address" })
  .max(254);

const Password = z
  .string()
  .min(8, "Password must be at least 8 characters")
  .max(72, "Password too long") // bcrypt input limit
  .refine((v) => /[a-zA-Z]/.test(v), "Password must contain a letter")
  .refine((v) => /\d/.test(v), "Password must contain a number");

const OtpCode = z
  .string()
  .trim()
  .regex(/^\d{6}$/, "OTP must be 6 digits");

export const SignupSchema = z.object({
  email: Email,
  password: Password,
  marketingOptIn: z.boolean().optional().default(false),
  signupSource: z.string().max(80).optional(),
});
export type SignupInput = z.infer<typeof SignupSchema>;

export const VerifyEmailSchema = z.object({
  email: Email,
  code: OtpCode,
});
export type VerifyEmailInput = z.infer<typeof VerifyEmailSchema>;

export const ResendOtpSchema = z.object({
  email: Email,
  purpose: z.enum(["EMAIL_VERIFY", "PASSWORD_RESET"]),
});
export type ResendOtpInput = z.infer<typeof ResendOtpSchema>;

export const LoginSchema = z.object({
  email: Email,
  password: z.string().min(1, "Password required").max(72),
  rememberMe: z.boolean().optional().default(false),
});
export type LoginInput = z.infer<typeof LoginSchema>;

export const ForgotPasswordSchema = z.object({
  email: Email,
});
export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;

export const ResetPasswordSchema = z.object({
  email: Email,
  code: OtpCode,
  newPassword: Password,
});
export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;
