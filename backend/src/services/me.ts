/**
 * Customer profile, address book, avatar uploads, email change, and account deletion.
 *
 * Email change follows PRD §16 #75: password + OTP to new inbox, then OTP to current inbox.
 */
import { createHash } from "node:crypto";

import { Prisma } from "@prisma/client";

import { emailChangeOtpEmail } from "../emails/templates.js";
import { prisma } from "../utils/prisma.js";
import { verifyPassword } from "../utils/password.js";
import {
  Conflict,
  Forbidden,
  NotFound,
  Unauthorized,
  ValidationError,
} from "../utils/errors.js";
import { sendEmail } from "./email.js";
import { consumeOtp, issueOtp } from "./auth.js";
import { presignUpload, buildPublicUrl, isStorageConfigured } from "./storage.js";
import type {
  AddressInput,
  AddressUpdateInput,
  AvatarConfirmInput,
  EmailChangeInput,
  UpdateProfileInput,
} from "../validators/me.js";

const profileSelect = {
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
  marketingOptInAt: true,
  tags: true,
  isActive: true,
  restrictions: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

/**
 * Returns the authenticated user's profile fields (same shape as GET /v1/auth/me user).
 */
export async function getProfile(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: profileSelect,
  });
  if (!user) throw Unauthorized("Account not found");
  return user;
}

/**
 * PATCH /v1/me/profile — partial update of name, phone, gender, DOB, marketing opt-in.
 */
export async function updateProfile(userId: string, input: UpdateProfileInput) {
  const data: Prisma.UserUpdateInput = {};

  if (input.name !== undefined) {
    data.name = input.name && input.name.length > 0 ? input.name : null;
  }
  if (input.phone !== undefined) data.phone = input.phone ?? null;
  if (input.gender !== undefined) data.gender = input.gender;
  if (input.dateOfBirth !== undefined) data.dateOfBirth = input.dateOfBirth ?? null;
  if (input.marketingOptIn !== undefined) {
    data.marketingOptIn = input.marketingOptIn;
    data.marketingOptInAt = input.marketingOptIn ? new Date() : null;
  }

  if (Object.keys(data).length === 0) {
    return getProfile(userId);
  }

  await prisma.user.update({
    where: { id: userId },
    data,
  });

  return getProfile(userId);
}

/**
 * Multi-step email change: `request` | `verify_new` | `verify_old`.
 */
export async function changeEmail(
  userId: string,
  body: EmailChangeInput,
  ip?: string,
): Promise<
  | { phase: "verify_new" }
  | { phase: "verify_old" }
  | { phase: "complete"; email: string }
> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      passwordHash: true,
      name: true,
      role: true,
    },
  });
  if (!user) throw Unauthorized("Account not found");

  if (body.phase === "request") {
    const newEmail = body.newEmail.toLowerCase();
    if (newEmail === user.email.toLowerCase()) {
      throw ValidationError("New email must be different from your current email");
    }

    const exists = await prisma.user.findUnique({ where: { email: newEmail } });
    if (exists) throw Conflict("That email is already registered");

    if (!user.passwordHash) {
      throw ValidationError("Set a password on your account before changing email");
    }

    const okPwd = await verifyPassword(body.currentPassword, user.passwordHash);
    if (!okPwd) throw Unauthorized("Invalid password");

    const code = await issueOtp(newEmail, "EMAIL_CHANGE", ip, user.id);
    const tpl = emailChangeOtpEmail({
      code,
      name: user.name ?? undefined,
      sentTo: "new",
    });
    await sendEmail({
      to: newEmail,
      ...tpl,
      template: "email_change_new",
      refType: "USER",
      refId: user.id,
    });

    return { phase: "verify_new" };
  }

  if (body.phase === "verify_new") {
    const newEmail = body.newEmail.toLowerCase();
    if (newEmail === user.email.toLowerCase()) {
      throw ValidationError("Invalid email change session");
    }

    await consumeOtp(newEmail, body.code, "EMAIL_CHANGE", userId);

    const code = await issueOtp(user.email.toLowerCase(), "EMAIL_CHANGE", ip, user.id);
    const tpl = emailChangeOtpEmail({
      code,
      name: user.name ?? undefined,
      sentTo: "current",
    });
    await sendEmail({
      to: user.email,
      ...tpl,
      template: "email_change_old",
      refType: "USER",
      refId: user.id,
    });

    return { phase: "verify_old" };
  }

  // verify_old
  const newEmail = body.newEmail.toLowerCase();
  if (newEmail === user.email.toLowerCase()) {
    throw ValidationError("New email must differ from current email");
  }

  await consumeOtp(user.email.toLowerCase(), body.code, "EMAIL_CHANGE", userId);

  const clash = await prisma.user.findFirst({
    where: { email: newEmail, NOT: { id: userId } },
  });
  if (clash) throw Conflict("That email was just registered — start the change again");

  await prisma.$transaction([
    prisma.user.update({
      where: { id: userId },
      data: {
        email: newEmail,
        tokenVersion: { increment: 1 },
      },
    }),
    prisma.auditLog.create({
      data: {
        actorId: userId,
        action: "USER_EMAIL_CHANGED",
        entity: "User",
        entityId: userId,
        diff: { fromEmail: user.email, toEmail: newEmail },
        ip: ip ?? null,
      },
    }),
  ]);

  return { phase: "complete", email: newEmail };
}

/**
 * Issues a presigned PUT for a profile image. Returns null when R2 is not configured.
 */
export async function createAvatarUploadUrl(args: {
  userId: string;
  contentType: "image/jpeg" | "image/png" | "image/webp";
}) {
  if (!isStorageConfigured) return null;
  return presignUpload({
    scope: "avatars",
    ownerId: args.userId,
    contentType: args.contentType,
  });
}

/**
 * Persists `profileImageUrl` after the client uploaded to the presigned URL.
 * Verifies the object key is scoped to this user under `avatars/{userId}/`.
 */
export async function confirmAvatar(userId: string, input: AvatarConfirmInput) {
  const prefix = `avatars/${userId}/`;
  if (!input.key.startsWith(prefix)) {
    throw ValidationError("Invalid upload key for this account");
  }

  const expectedUrl = buildPublicUrl(input.key);
  if (input.publicUrl !== expectedUrl) {
    throw ValidationError("publicUrl does not match storage key — use the URL from the presign response");
  }

  await prisma.user.update({
    where: { id: userId },
    data: { profileImageUrl: input.publicUrl },
  });

  return getProfile(userId);
}

/** Lists saved addresses for the user (newest first). */
export async function listAddresses(userId: string) {
  return prisma.address.findMany({
    where: { userId },
    orderBy: [{ isDefault: "desc" }, { updatedAt: "desc" }],
  });
}

/**
 * Creates an address; when `isDefault`, clears default on other rows in one transaction.
 */
export async function createAddress(userId: string, input: AddressInput) {
  return prisma.$transaction(async (tx) => {
    if (input.isDefault) {
      await tx.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    return tx.address.create({
      data: {
        userId,
        label: input.label ?? null,
        name: input.name,
        phone: input.phone,
        line1: input.line1,
        line2: input.line2 ?? null,
        city: input.city,
        state: input.state,
        pincode: input.pincode,
        country: input.country,
        isDefault: input.isDefault,
      },
    });
  });
}

/**
 * PATCH /v1/me/addresses/:id — partial update.
 */
export async function updateAddress(
  userId: string,
  addressId: string,
  input: AddressUpdateInput,
) {
  const existing = await prisma.address.findFirst({
    where: { id: addressId, userId },
  });
  if (!existing) throw NotFound("Address not found");

  return prisma.$transaction(async (tx) => {
    if (input.isDefault === true) {
      await tx.address.updateMany({
        where: { userId },
        data: { isDefault: false },
      });
    }

    const data: Prisma.AddressUpdateInput = {};
    if (input.label !== undefined) data.label = input.label ?? null;
    if (input.name !== undefined) data.name = input.name;
    if (input.phone !== undefined) data.phone = input.phone;
    if (input.line1 !== undefined) data.line1 = input.line1;
    if (input.line2 !== undefined) data.line2 = input.line2 ?? null;
    if (input.city !== undefined) data.city = input.city;
    if (input.state !== undefined) data.state = input.state;
    if (input.pincode !== undefined) data.pincode = input.pincode;
    if (input.country !== undefined) data.country = input.country;
    if (input.isDefault !== undefined) data.isDefault = input.isDefault;

    if (Object.keys(data).length === 0) return existing;

    return tx.address.update({
      where: { id: addressId },
      data,
    });
  });
}

/** Deletes an address; promotes another row to default when needed. */
export async function deleteAddress(userId: string, addressId: string) {
  const existing = await prisma.address.findFirst({
    where: { id: addressId, userId },
  });
  if (!existing) throw NotFound("Address not found");

  await prisma.$transaction(async (tx) => {
    await tx.address.delete({ where: { id: addressId } });

    if (existing.isDefault) {
      const next = await tx.address.findFirst({
        where: { userId },
        orderBy: { updatedAt: "desc" },
      });
      if (next) {
        await tx.address.update({
          where: { id: next.id },
          data: { isDefault: true },
        });
      }
    }
  });
}

/**
 * Marks one address as default and clears the flag on siblings.
 */
export async function setDefaultAddress(userId: string, addressId: string) {
  const existing = await prisma.address.findFirst({
    where: { id: addressId, userId },
  });
  if (!existing) throw NotFound("Address not found");

  await prisma.$transaction([
    prisma.address.updateMany({
      where: { userId },
      data: { isDefault: false },
    }),
    prisma.address.update({
      where: { id: addressId },
      data: { isDefault: true },
    }),
  ]);

  return prisma.address.findUnique({ where: { id: addressId } });
}

/**
 * Soft-delete + DPDP-style anonymization: PII cleared, orders retained without user link.
 */
export async function deleteAccount(
  userId: string,
  args: { currentPassword: string; reason?: string; ip?: string },
) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      passwordHash: true,
      role: true,
      email: true,
    },
  });
  if (!user) throw Unauthorized("Account not found");
  if (user.role === "ADMIN") {
    throw Forbidden("Admin accounts cannot be deleted through the customer API");
  }
  if (!user.passwordHash) throw ValidationError("Account has no password set — contact support");

  const pwdOk = await verifyPassword(args.currentPassword, user.passwordHash);
  if (!pwdOk) throw Unauthorized("Invalid password");

  const hash = createHash("sha256").update(user.id).digest("hex").slice(0, 32);
  const placeholderEmail = `deleted+${hash}@anonymized.diteup.invalid`;

  await prisma.$transaction(async (tx) => {
    await tx.reviewHelpful.deleteMany({ where: { userId: user.id } });
    await tx.authOTP.deleteMany({ where: { userId: user.id } });
    await tx.passwordResetToken.deleteMany({ where: { userId: user.id } });
    await tx.address.deleteMany({ where: { userId: user.id } });

    await tx.order.updateMany({
      where: { userId: user.id },
      data: { userId: null },
    });
    await tx.couponRedemption.updateMany({
      where: { userId: user.id },
      data: { userId: null },
    });
    await tx.review.updateMany({
      where: { userId: user.id },
      data: { userId: null },
    });

    await tx.user.update({
      where: { id: user.id },
      data: {
        email: placeholderEmail,
        passwordHash: null,
        name: null,
        phone: null,
        profileImageUrl: null,
        gender: null,
        dateOfBirth: null,
        emailVerified: false,
        emailVerifiedAt: null,
        phoneVerified: false,
        phoneVerifiedAt: null,
        isActive: false,
        deactivationReason: args.reason ?? "USER_SELF_DELETE",
        marketingOptIn: false,
        marketingOptInAt: null,
        tags: [],
        restrictions: Prisma.DbNull,
        adminNotes: null,
        tokenVersion: { increment: 1 },
        failedLoginAttempts: 0,
        lockedUntil: null,
      },
    });

    await tx.auditLog.create({
      data: {
        actorId: user.id,
        action: "USER_ANONYMIZED_SELF",
        entity: "User",
        entityId: user.id,
        diff: { priorEmailHash: hash },
        ip: args.ip ?? null,
      },
    });
  });
}
