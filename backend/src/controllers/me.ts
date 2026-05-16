/**
 * HTTP handlers for /v1/me/* (profile, addresses, avatar, account deletion).
 */
import type { Request, Response, NextFunction } from "express";

import * as meService from "../services/me.js";
import { listOrdersForUser } from "../services/orderReadCancel.js";
import { cookieNames } from "../services/auth.js";
import { Unauthorized } from "../utils/errors.js";

function clientIp(req: Request): string | undefined {
  return req.ip ?? req.socket.remoteAddress ?? undefined;
}

/** GET /v1/me/profile */
export async function getProfile(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw Unauthorized();
    const profile = await meService.getProfile(req.auth.userId);
    res.status(200).json({ profile });
  } catch (err) {
    next(err);
  }
}

/** PATCH /v1/me/profile */
export async function patchProfile(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw Unauthorized();
    const profile = await meService.updateProfile(req.auth.userId, req.body);
    res.status(200).json({ profile });
  } catch (err) {
    next(err);
  }
}

/** POST /v1/me/email/change */
export async function postEmailChange(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw Unauthorized();
    const result = await meService.changeEmail(req.auth.userId, req.body, clientIp(req));

    if (result.phase === "complete") {
      res.status(200).json({
        message: "Email updated. Sign in again on every device — all previous sessions were signed out.",
        email: result.email,
        phase: "complete",
      });
      return;
    }

    const msg =
      result.phase === "verify_new"
        ? "Enter the code sent to your new email."
        : "Enter the code sent to your current email to finish.";
    res.status(200).json({ phase: result.phase, message: msg });
  } catch (err) {
    next(err);
  }
}

/** POST /v1/me/avatar — presigned upload URL */
export async function postAvatarPresign(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw Unauthorized();
    const presigned = await meService.createAvatarUploadUrl({
      userId: req.auth.userId,
      contentType: req.body.contentType,
    });
    if (!presigned) {
      res.status(503).json({
        error: {
          code: "SERVICE_UNAVAILABLE",
          message: "File uploads are not configured on this server",
        },
      });
      return;
    }
    res.status(200).json(presigned);
  } catch (err) {
    next(err);
  }
}

/** POST /v1/me/avatar/confirm — save profile image URL after PUT to storage */
export async function postAvatarConfirm(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw Unauthorized();
    const profile = await meService.confirmAvatar(req.auth.userId, req.body);
    res.status(200).json({ profile });
  } catch (err) {
    next(err);
  }
}

/** GET /v1/me/addresses */
export async function getAddresses(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw Unauthorized();
    const addresses = await meService.listAddresses(req.auth.userId);
    res.status(200).json({ addresses });
  } catch (err) {
    next(err);
  }
}

/** POST /v1/me/addresses */
export async function postAddress(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw Unauthorized();
    const address = await meService.createAddress(req.auth.userId, req.body);
    res.status(201).json({ address });
  } catch (err) {
    next(err);
  }
}

/** PATCH /v1/me/addresses/:id */
export async function patchAddress(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw Unauthorized();
    const addressId = String(req.params.id);
    const address = await meService.updateAddress(req.auth.userId, addressId, req.body);
    res.status(200).json({ address });
  } catch (err) {
    next(err);
  }
}

/** DELETE /v1/me/addresses/:id */
export async function deleteAddress(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw Unauthorized();
    await meService.deleteAddress(req.auth.userId, String(req.params.id));
    res.status(204).send();
  } catch (err) {
    next(err);
  }
}

/** POST /v1/me/addresses/:id/default */
export async function postAddressDefault(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw Unauthorized();
    const address = await meService.setDefaultAddress(req.auth.userId, String(req.params.id));
    res.status(200).json({ address });
  } catch (err) {
    next(err);
  }
}

/** GET /v1/me/orders */
export async function getMyOrders(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw Unauthorized();
    const result = await listOrdersForUser(
      req.auth.userId,
      Number(req.query.offset) || 0,
      Number(req.query.limit) || 20,
    );
    res.status(200).json(result);
  } catch (err) {
    next(err);
  }
}

/** DELETE /v1/me — anonymize account */
export async function deleteMe(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw Unauthorized();
    await meService.deleteAccount(req.auth.userId, {
      currentPassword: req.body.currentPassword,
      reason: req.body.reason,
      ip: clientIp(req),
    });
    res
      .clearCookie(cookieNames.ACCESS, { path: "/" })
      .clearCookie(cookieNames.REFRESH, { path: "/v1/auth" })
      .status(200)
      .json({ message: "Your account has been deleted and personal data removed." });
  } catch (err) {
    next(err);
  }
}
