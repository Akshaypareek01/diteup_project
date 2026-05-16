/**
 * Public checkout routes: orders, payment verify (`/v1/...`).
 */
import { Router } from "express";

import * as ordersController from "../controllers/orders.js";
import * as paymentsController from "../controllers/payments.js";
import { optionalAuth } from "../middleware/auth.js";
import { rateLimit } from "../middleware/rateLimit.js";
import { validate } from "../middleware/validate.js";
import {
  CancelOrderBodySchema,
  CreateOrderBodySchema,
  GetOrderQuerySchema,
  OrderNumberParamSchema,
  VerifyPaymentBodySchema,
} from "../validators/orders.js";

const router = Router();

router.use(optionalAuth);

router.post(
  "/orders",
  rateLimit({ windowMs: 60 * 60 * 1000, max: 60 }),
  validate({ body: CreateOrderBodySchema }),
  ordersController.postCreateOrder,
);

router.get(
  "/orders/:orderNumber",
  validate({ params: OrderNumberParamSchema, query: GetOrderQuerySchema }),
  ordersController.getOneOrder,
);

router.post(
  "/orders/:orderNumber/cancel",
  rateLimit({ windowMs: 60 * 60 * 1000, max: 40 }),
  validate({ params: OrderNumberParamSchema, body: CancelOrderBodySchema }),
  ordersController.postCancelOrder,
);

router.post(
  "/payments/verify",
  rateLimit({ windowMs: 60 * 60 * 1000, max: 120 }),
  validate({ body: VerifyPaymentBodySchema }),
  paymentsController.postVerifyPayment,
);

export default router;
