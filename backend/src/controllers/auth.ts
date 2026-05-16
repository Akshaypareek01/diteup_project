/**
 * Thin HTTP layer over the auth service.
 * Responsible for: extracting input, setting/clearing cookies, shaping responses.
 * All business logic lives in services/auth.ts.
 */
import type { Request, Response, NextFunction } from "express";

import * as authService from "../services/auth.js";
import { Unauthorized } from "../utils/errors.js";

function ip(req: Request): string | undefined {
  return req.ip ?? req.socket.remoteAddress ?? undefined;
}

export async function signup(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.signup({ ...req.body, ip: ip(req) });
    res.status(202).json({
      message: "Verification code sent. Check your email.",
      ...result,
    });
  } catch (err) {
    next(err);
  }
}

export async function verifyEmail(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.verifyEmail({ ...req.body, ip: ip(req) });
    res
      .cookie(authService.cookieNames.ACCESS, result.accessToken, authService.accessCookieOptions())
      .cookie(
        authService.cookieNames.REFRESH,
        result.refreshToken,
        authService.refreshCookieOptions(false),
      )
      .status(200)
      .json({
        message: "Email verified",
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
  } catch (err) {
    next(err);
  }
}

export async function resendOtp(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.resendOtp({ ...req.body, ip: ip(req) });
    res.status(200).json({ message: "Code sent if the account exists.", ...result });
  } catch (err) {
    next(err);
  }
}

export async function login(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.login({ ...req.body, ip: ip(req) });
    res
      .cookie(authService.cookieNames.ACCESS, result.accessToken, authService.accessCookieOptions())
      .cookie(
        authService.cookieNames.REFRESH,
        result.refreshToken,
        authService.refreshCookieOptions(req.body.rememberMe ?? false),
      )
      .status(200)
      .json({
        message: "Logged in",
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
  } catch (err) {
    next(err);
  }
}

export async function refresh(req: Request, res: Response, next: NextFunction) {
  try {
    const token = req.cookies?.[authService.cookieNames.REFRESH] ?? req.body?.refreshToken;
    if (!token) throw Unauthorized("Refresh token missing");
    const { accessToken } = await authService.refresh(token);
    res
      .cookie(authService.cookieNames.ACCESS, accessToken, authService.accessCookieOptions())
      .status(200)
      .json({ accessToken });
  } catch (err) {
    next(err);
  }
}

export async function logout(req: Request, res: Response, next: NextFunction) {
  try {
    if (req.auth) await authService.logout(req.auth.userId);
    res
      .clearCookie(authService.cookieNames.ACCESS, { path: "/" })
      .clearCookie(authService.cookieNames.REFRESH, { path: "/v1/auth" })
      .status(200)
      .json({ message: "Logged out" });
  } catch (err) {
    next(err);
  }
}

export async function forgotPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.forgotPassword({ ...req.body, ip: ip(req) });
    res.status(200).json({ message: "Reset code sent if the account exists.", ...result });
  } catch (err) {
    next(err);
  }
}

export async function resetPassword(req: Request, res: Response, next: NextFunction) {
  try {
    const result = await authService.resetPassword({ ...req.body, ip: ip(req) });
    res
      .cookie(authService.cookieNames.ACCESS, result.accessToken, authService.accessCookieOptions())
      .cookie(
        authService.cookieNames.REFRESH,
        result.refreshToken,
        authService.refreshCookieOptions(false),
      )
      .status(200)
      .json({
        message: "Password reset successful",
        user: result.user,
        accessToken: result.accessToken,
        refreshToken: result.refreshToken,
      });
  } catch (err) {
    next(err);
  }
}

export async function me(req: Request, res: Response, next: NextFunction) {
  try {
    if (!req.auth) throw Unauthorized();
    const user = await authService.getMe(req.auth.userId);
    res.status(200).json({ user });
  } catch (err) {
    next(err);
  }
}
