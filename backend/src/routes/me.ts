/**
 * Authenticated customer routes: profile, addresses, avatar, email change, account deletion.
 */
import { Router } from "express";

import * as meController from "../controllers/me.js";
import { authRequired } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rateLimit.js";
import { validate } from "../middleware/validate.js";
import {
  AddressBaseSchema,
  AddressIdParamSchema,
  AddressUpdateSchema,
  AvatarConfirmSchema,
  AvatarUploadUrlSchema,
  DeleteAccountSchema,
  EmailChangeSchema,
  UpdateProfileSchema,
} from "../validators/me.js";
import { MeOrdersQuerySchema } from "../validators/orders.js";

const router = Router();

router.use(authRequired);

router.get("/profile", meController.getProfile);
router.get(
  "/orders",
  validate({ query: MeOrdersQuerySchema }),
  meController.getMyOrders,
);
router.patch(
  "/profile",
  validate({ body: UpdateProfileSchema }),
  meController.patchProfile,
);

router.post(
  "/email/change",
  rateLimit({ windowMs: 60 * 60 * 1000, max: 10, message: "Too many email change attempts" }),
  validate({ body: EmailChangeSchema }),
  meController.postEmailChange,
);

router.post(
  "/avatar",
  rateLimit({ windowMs: 60 * 60 * 1000, max: 30 }),
  validate({ body: AvatarUploadUrlSchema }),
  meController.postAvatarPresign,
);

router.post(
  "/avatar/confirm",
  validate({ body: AvatarConfirmSchema }),
  meController.postAvatarConfirm,
);

router.get("/addresses", meController.getAddresses);

router.post(
  "/addresses",
  validate({ body: AddressBaseSchema }),
  meController.postAddress,
);

router.patch(
  "/addresses/:id",
  validate({ params: AddressIdParamSchema, body: AddressUpdateSchema }),
  meController.patchAddress,
);

router.delete(
  "/addresses/:id",
  validate({ params: AddressIdParamSchema }),
  meController.deleteAddress,
);

router.post(
  "/addresses/:id/default",
  validate({ params: AddressIdParamSchema }),
  meController.postAddressDefault,
);

router.delete(
  "/",
  rateLimit({ windowMs: 24 * 60 * 60 * 1000, max: 5, message: "Too many account deletion requests" }),
  validate({ body: DeleteAccountSchema }),
  meController.deleteMe,
);

export default router;
