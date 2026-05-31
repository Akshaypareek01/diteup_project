/**
 * Auth service — business logic for all /v1/auth/* endpoints.
 *
 * Implements PRD §6.6 with edge cases from §16:
 *  - 71: unverified accounts allowed to exist; can't checkout (enforced elsewhere)
 *  - 72: OTP brute force — max 5 attempts per AuthOTP row, row invalidated on overflow
 *  - 73: OTPs expire in 10 minutes
 *  - 74: requesting a new OTP invalidates the previous one for that email+purpose
 *  - 75: email change — handled in services/me.ts (dual OTP + password)
 *  - 84: tokenVersion bumped on logout-all / password reset to invalidate refresh tokens
 *  - 95: account enumeration prevention — signup + forgot-password return same shape for new vs existing
 */
import type { Prisma, OTPPurpose } from "@prisma/client";

import { prisma } from "../utils/prisma.js";
import { hashPassword, verifyPassword } from "../utils/password.js";
import { signAccessToken, signRefreshToken, verifyRefreshToken } from "../utils/jwt.js";
import {
  generateOtpCode,
  hashOtp,
  otpConstants,
  otpExpiry,
  verifyOtp,
} from "../utils/otp.js";
import {
  AccountLocked,
  AppError,
  OtpExpired,
  OtpInvalid,
  OtpLocked,
  Unauthorized,
  ValidationError,
} from "../utils/errors.js";
import { sendEmail } from "./email.js";
import {
  otpVerifyEmail,
  passwordResetEmail,
  welcomeEmail,
} from "../emails/templates.js";
import { logger } from "../utils/logger.js";

// ---- Constants ----------------------------------------------------------
const LOGIN_MAX_ATTEMPTS = 5;
const LOGIN_LOCK_MS = 30 * 60 * 1000;            // 30 minutes
const OTP_RESEND_COOLDOWN_MS = 60 * 1000;         // 60 seconds between resends
const REFRESH_COOKIE = "dt_refresh";
const ACCESS_COOKIE = "dt_access";

// ---- Helpers ------------------------------------------------------------

/**
 * Find an existing user by email (lowercased). Email is unique and stored lowercase.
 */
async function findUserByEmail(email: string) {
  return prisma.user.findUnique({ where: { email: email.toLowerCase() } });
}

/**
 * Issue an OTP for a given email + purpose.
 *  - Invalidates any previous unused OTP for that email/purpose (PRD §16/74).
 *  - Enforces 60s resend cooldown.
 *  - Returns the plaintext code so the caller can email it.
 */
export async function issueOtp(
  email: string,
  purpose: OTPPurpose,
  ip?: string,
  userId?: string | null,
): Promise<string> {
  // Cooldown: latest unused OTP for this email/purpose must be older than 60s
  const recent = await prisma.authOTP.findFirst({
    where: { email, purpose, usedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (recent && Date.now() - recent.createdAt.getTime() < OTP_RESEND_COOLDOWN_MS) {
    throw new AppError({
      statusCode: 429,
      code: "RATE_LIMITED",
      message: "Please wait a few seconds before requesting another code",
    });
  }

  // Invalidate any unused OTPs for this email+purpose
  await prisma.authOTP.updateMany({
    where: { email, purpose, usedAt: null },
    data: { usedAt: new Date() },
  });

  const code = generateOtpCode();
  const codeHash = await hashOtp(code);

  await prisma.authOTP.create({
    data: {
      email,
      codeHash,
      purpose,
      expiresAt: otpExpiry(),
      ip,
      userId: userId ?? null,
    },
  });

  return code;
}

/**
 * Consume an OTP — finds the latest unused row, checks expiry/attempts, verifies code,
 * marks it used on success.
 */
export async function consumeOtp(
  email: string,
  code: string,
  purpose: OTPPurpose,
  expectedUserId?: string,
): Promise<void> {
  const otp = await prisma.authOTP.findFirst({
    where: { email, purpose, usedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (!otp) throw OtpInvalid("No active code — request a new one");

  if (expectedUserId !== undefined && otp.userId !== expectedUserId) {
    throw OtpInvalid("Invalid code");
  }

  if (otp.expiresAt < new Date()) {
    await prisma.authOTP.update({ where: { id: otp.id }, data: { usedAt: new Date() } });
    throw OtpExpired();
  }

  if (otp.attemptCount >= otpConstants.MAX_ATTEMPTS) {
    // Lock this OTP — caller must request a new one
    await prisma.authOTP.update({ where: { id: otp.id }, data: { usedAt: new Date() } });
    throw OtpLocked();
  }

  const ok = await verifyOtp(code, otp.codeHash);
  if (!ok) {
    await prisma.authOTP.update({
      where: { id: otp.id },
      data: { attemptCount: { increment: 1 } },
    });
    throw OtpInvalid();
  }

  // Success — mark as used
  await prisma.authOTP.update({ where: { id: otp.id }, data: { usedAt: new Date() } });
}

function buildTokens(user: { id: string; role: "CUSTOMER" | "ADMIN"; emailVerified: boolean; tokenVersion: number }) {
  const accessToken = signAccessToken({
    sub: user.id,
    role: user.role,
    emailVerified: user.emailVerified,
    tv: user.tokenVersion,
  });
  const refreshToken = signRefreshToken({
    sub: user.id,
    tokenVersion: user.tokenVersion,
  });
  return { accessToken, refreshToken };
}

// ---- Public service API -------------------------------------------------

export type AuthResult = {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string | null;
    role: "CUSTOMER" | "ADMIN";
    emailVerified: boolean;
  };
};

/**
 * POST /v1/auth/signup
 * Creates a new user (or returns the same response if email exists — enumeration safe).
 * Always sends an EMAIL_VERIFY OTP. Caller can call resend-otp if user lost the email.
 */
export async function signup(input: {
  email: string;
  password: string;
  marketingOptIn: boolean;
  signupSource?: string;
  ip?: string;
}): Promise<{ requiresOtp: true; email: string }> {
  const email = input.email.toLowerCase();
  const existing = await findUserByEmail(email);

  if (existing && existing.emailVerified) {
    // Anti-enumeration: do not reveal that email exists. Return the same shape
    // as a fresh signup. No OTP is sent.
    logger.info({ email }, "signup attempt on verified existing email (silent)");
    return { requiresOtp: true, email };
  }

  if (existing && !existing.emailVerified) {
    // User signed up before but never verified. Resend OTP, don't recreate row.
    const code = await issueOtp(email, "EMAIL_VERIFY", input.ip, existing.id);
    const tpl = otpVerifyEmail({ code, name: existing.name ?? undefined });
    await sendEmail({ to: email, ...tpl, template: "otp_verify", refType: "USER", refId: existing.id });
    return { requiresOtp: true, email };
  }

  // Fresh signup
  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: {
      email,
      passwordHash,
      marketingOptIn: input.marketingOptIn,
      marketingOptInAt: input.marketingOptIn ? new Date() : null,
      signupSource: input.signupSource,
    },
  });

  const code = await issueOtp(email, "EMAIL_VERIFY", input.ip, user.id);
  const tpl = otpVerifyEmail({ code });
  await sendEmail({ to: email, ...tpl, template: "otp_verify", refType: "USER", refId: user.id });

  return { requiresOtp: true, email };
}

/**
 * POST /v1/auth/verify-email
 * Consumes the EMAIL_VERIFY OTP, sets emailVerified, issues tokens.
 */
export async function verifyEmail(input: { email: string; code: string; ip?: string }): Promise<AuthResult> {
  const user = await findUserByEmail(input.email);
  if (!user) throw OtpInvalid("Invalid code");

  await consumeOtp(input.email.toLowerCase(), input.code, "EMAIL_VERIFY", user.id);

  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      emailVerified: true,
      emailVerifiedAt: new Date(),
      lastLoginAt: new Date(),
      lastLoginIp: input.ip,
      failedLoginAttempts: 0,
      lockedUntil: null,
    },
  });

  // Fire welcome email (best-effort)
  void sendEmail({
    to: updated.email,
    ...welcomeEmail({ name: updated.name ?? undefined }),
    template: "welcome",
    refType: "USER",
    refId: updated.id,
  });

  const tokens = buildTokens(updated);
  return {
    ...tokens,
    user: {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      role: updated.role,
      emailVerified: true,
    },
  };
}

/**
 * POST /v1/auth/resend-otp
 * Re-sends an OTP. Anti-enumeration: returns same shape whether email exists or not.
 */
export async function resendOtp(input: {
  email: string;
  purpose: "EMAIL_VERIFY" | "PASSWORD_RESET";
  ip?: string;
}): Promise<{ sent: true }> {
  const user = await findUserByEmail(input.email);

  // For EMAIL_VERIFY, only meaningful if user exists and is unverified.
  // For PASSWORD_RESET, only meaningful if user exists and is verified.
  // In both cases we return { sent: true } regardless to prevent enumeration.
  const shouldActuallySend =
    (input.purpose === "EMAIL_VERIFY" && user && !user.emailVerified) ||
    (input.purpose === "PASSWORD_RESET" && user && user.emailVerified);

  if (!shouldActuallySend) {
    logger.info({ email: input.email, purpose: input.purpose }, "resend-otp no-op (anti-enumeration)");
    return { sent: true };
  }

  const code = await issueOtp(input.email.toLowerCase(), input.purpose, input.ip, user!.id);
  const tpl =
    input.purpose === "EMAIL_VERIFY"
      ? otpVerifyEmail({ code, name: user!.name ?? undefined })
      : passwordResetEmail({ code, name: user!.name ?? undefined });
  await sendEmail({
    to: input.email,
    ...tpl,
    template: input.purpose === "EMAIL_VERIFY" ? "otp_verify" : "password_reset",
    refType: "USER",
    refId: user!.id,
  });
  return { sent: true };
}

/**
 * POST /v1/auth/login
 * Verifies password, increments failure counter, locks after 5 failures.
 */
export async function login(input: {
  email: string;
  password: string;
  rememberMe: boolean;
  ip?: string;
}): Promise<AuthResult> {
  const user = await findUserByEmail(input.email);
  if (!user || !user.passwordHash) {
    // Use same delay & message as wrong password (timing-resistant-ish at this scale)
    throw Unauthorized("Invalid email or password");
  }

  // Locked?
  if (user.lockedUntil && user.lockedUntil > new Date()) {
    const minutes = Math.ceil((user.lockedUntil.getTime() - Date.now()) / 60000);
    throw AccountLocked(`Account locked. Try again in ${minutes} minute${minutes === 1 ? "" : "s"}.`);
  }

  if (!user.isActive) {
    throw Unauthorized("Account is disabled. Contact support.");
  }

  const ok = await verifyPassword(input.password, user.passwordHash);
  if (!ok) {
    const attempts = user.failedLoginAttempts + 1;
    const updateData: Prisma.UserUpdateInput = { failedLoginAttempts: attempts };
    if (attempts >= LOGIN_MAX_ATTEMPTS) {
      updateData.lockedUntil = new Date(Date.now() + LOGIN_LOCK_MS);
      updateData.failedLoginAttempts = 0; // reset; lock is the new gate
    }
    await prisma.user.update({ where: { id: user.id }, data: updateData });
    if (attempts >= LOGIN_MAX_ATTEMPTS) {
      throw AccountLocked("Too many failed attempts. Account locked for 30 minutes.");
    }
    throw Unauthorized("Invalid email or password");
  }

  // Success — reset counter, update last-login
  const fresh = await prisma.user.update({
    where: { id: user.id },
    data: {
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
      lastLoginIp: input.ip,
    },
  });

  const tokens = buildTokens(fresh);
  return {
    ...tokens,
    user: {
      id: fresh.id,
      email: fresh.email,
      name: fresh.name,
      role: fresh.role,
      emailVerified: fresh.emailVerified,
    },
  };
}

/**
 * POST /v1/auth/refresh — uses refresh token to mint a new access token.
 */
export async function refresh(refreshToken: string): Promise<{ accessToken: string }> {
  let payload: ReturnType<typeof verifyRefreshToken>;
  try {
    payload = verifyRefreshToken(refreshToken);
  } catch {
    throw Unauthorized("Invalid refresh token");
  }

  const user = await prisma.user.findUnique({ where: { id: payload.sub } });
  if (!user || !user.isActive) throw Unauthorized("Session invalid");
  if (user.tokenVersion !== payload.tokenVersion) {
    throw Unauthorized("Session expired — please log in again");
  }

  const accessToken = signAccessToken({
    sub: user.id,
    role: user.role,
    emailVerified: user.emailVerified,
    tv: user.tokenVersion,
  });
  return { accessToken };
}

/**
 * POST /v1/auth/logout — bumps tokenVersion to invalidate all sessions (server-side).
 * Caller also clears cookies on the client.
 */
export async function logout(userId: string): Promise<void> {
  await prisma.user.update({
    where: { id: userId },
    data: { tokenVersion: { increment: 1 } },
  });
}

/**
 * POST /v1/auth/forgot-password — sends PASSWORD_RESET OTP. Anti-enumeration safe.
 */
export async function forgotPassword(input: { email: string; ip?: string }): Promise<{ sent: true }> {
  const user = await findUserByEmail(input.email);
  if (!user || !user.emailVerified || !user.isActive) {
    // Same response regardless to prevent leaking which emails are registered
    return { sent: true };
  }
  const code = await issueOtp(input.email.toLowerCase(), "PASSWORD_RESET", input.ip, user.id);
  const tpl = passwordResetEmail({ code, name: user.name ?? undefined });
  await sendEmail({ to: input.email, ...tpl, template: "password_reset", refType: "USER", refId: user.id });
  return { sent: true };
}

/**
 * POST /v1/auth/reset-password
 * Verifies the OTP, sets new password, bumps tokenVersion to kill all sessions.
 * Returns fresh tokens.
 */
export async function resetPassword(input: {
  email: string;
  code: string;
  newPassword: string;
  ip?: string;
}): Promise<AuthResult> {
  const user = await findUserByEmail(input.email);
  if (!user) throw OtpInvalid("Invalid code");

  await consumeOtp(input.email.toLowerCase(), input.code, "PASSWORD_RESET", user.id);

  const passwordHash = await hashPassword(input.newPassword);
  const updated = await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      tokenVersion: { increment: 1 },           // invalidate every existing session
      failedLoginAttempts: 0,
      lockedUntil: null,
      lastLoginAt: new Date(),
      lastLoginIp: input.ip,
    },
  });

  const tokens = buildTokens(updated);
  return {
    ...tokens,
    user: {
      id: updated.id,
      email: updated.email,
      name: updated.name,
      role: updated.role,
      emailVerified: updated.emailVerified,
    },
  };
}

/**
 * GET /v1/auth/me — returns full profile of the authenticated user.
 */
export async function getMe(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      gender: true,
      dateOfBirth: true,
      profileImageUrl: true,
      role: true,
      emailVerified: true,
      phoneVerified: true,
      marketingOptIn: true,
      tags: true,
      isActive: true,
      restrictions: true,
      createdAt: true,
    },
  });
  if (!user) throw Unauthorized("Account not found");
  return user;
}

// ---- Cookie helpers (used by controller layer) --------------------------

export const cookieNames = { ACCESS: ACCESS_COOKIE, REFRESH: REFRESH_COOKIE } as const;

/** Refresh-token cookie options (httpOnly, secure in prod, scoped to refresh path). */
export function refreshCookieOptions(rememberMe: boolean) {
  const days = rememberMe ? 60 : 30;
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/v1/auth",
    maxAge: days * 24 * 60 * 60 * 1000,
  };
}

/** Access-token cookie options (shorter-lived, accessible to all /v1 routes). */
export function accessCookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 15 * 60 * 1000,
  };
}

// Re-export for outside use
export { ValidationError };
