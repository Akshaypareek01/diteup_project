/**
 * /v1/auth/* routes with per-endpoint rate limiting.
 *
 * Rate limit profiles (PRD §6.6, §13.2):
 *  - signup:           10/hour/IP   (block bot signups)
 *  - login:             5/15min/IP  (brute force)
 *  - resend-otp:        3/hour/email (email-keyed; relayed via body)
 *  - forgot-password:   5/hour/IP   (email enumeration + spam)
 *  - verify-email:     10/15min/IP  (OTP guesses bounded inside service too)
 *  - reset-password:   10/15min/IP
 *  - refresh:          60/min/IP    (token rotation is cheap)
 */
import { Router } from "express";

import * as controller from "../controllers/auth.js";
import { authRequired } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rateLimit.js";
import { validate } from "../middleware/validate.js";
import {
  ForgotPasswordSchema,
  LoginSchema,
  ResendOtpSchema,
  ResetPasswordSchema,
  SignupSchema,
  VerifyEmailSchema,
} from "../validators/auth.js";

const router = Router();

router.post(
  "/signup",
  rateLimit({ windowMs: 60 * 60 * 1000, max: 10, message: "Too many signup attempts" }),
  validate({ body: SignupSchema }),
  controller.signup,
);

router.post(
  "/verify-email",
  rateLimit({ windowMs: 15 * 60 * 1000, max: 10 }),
  validate({ body: VerifyEmailSchema }),
  controller.verifyEmail,
);

router.post(
  "/resend-otp",
  rateLimit({
    windowMs: 60 * 60 * 1000,
    max: 3,
    keyFn: (req) => (req.body?.email as string | undefined)?.toLowerCase() ?? req.ip ?? "anon",
    message: "Too many code requests — try again in an hour",
  }),
  validate({ body: ResendOtpSchema }),
  controller.resendOtp,
);

router.post(
  "/login",
  rateLimit({ windowMs: 15 * 60 * 1000, max: 5, message: "Too many login attempts" }),
  validate({ body: LoginSchema }),
  controller.login,
);

router.post(
  "/refresh",
  rateLimit({ windowMs: 60 * 1000, max: 60 }),
  controller.refresh,
);

router.post("/logout", authRequired, controller.logout);

router.post(
  "/forgot-password",
  rateLimit({ windowMs: 60 * 60 * 1000, max: 5 }),
  validate({ body: ForgotPasswordSchema }),
  controller.forgotPassword,
);

router.post(
  "/reset-password",
  rateLimit({ windowMs: 15 * 60 * 1000, max: 10 }),
  validate({ body: ResetPasswordSchema }),
  controller.resetPassword,
);

router.get("/me", authRequired, controller.me);

export default router;
