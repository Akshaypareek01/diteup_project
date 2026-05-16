/**
 * OTP generation, hashing, and verification.
 * 6-digit numeric codes. Stored as bcrypt hash. 10-minute default expiry.
 */
import { randomInt } from "node:crypto";
import bcrypt from "bcrypt";

const OTP_LENGTH = 6;
const OTP_TTL_MS = 10 * 60 * 1000; // 10 minutes
const OTP_HASH_COST = 8;            // lower than passwords — OTPs are short-lived
const MAX_ATTEMPTS = 5;

/** Generate a zero-padded 6-digit numeric OTP string. */
export function generateOtpCode(length = OTP_LENGTH): string {
  const max = 10 ** length;
  return String(randomInt(0, max)).padStart(length, "0");
}

export async function hashOtp(code: string): Promise<string> {
  return bcrypt.hash(code, OTP_HASH_COST);
}

export async function verifyOtp(code: string, hash: string): Promise<boolean> {
  return bcrypt.compare(code, hash);
}

export function otpExpiry(ttlMs = OTP_TTL_MS): Date {
  return new Date(Date.now() + ttlMs);
}

export const otpConstants = {
  MAX_ATTEMPTS,
  TTL_MS: OTP_TTL_MS,
  LENGTH: OTP_LENGTH,
} as const;
