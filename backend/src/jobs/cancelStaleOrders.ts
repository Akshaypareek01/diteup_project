/**
 * Scheduled job: auto-cancel unpaid Razorpay orders past `checkout.orderCancelAfterMinutes`.
 */
import { prisma } from "../utils/prisma.js";
import { logger } from "../utils/logger.js";
import { getCheckoutDefaults } from "../services/settings.js";
import { systemAutoCancelUnpaidOrder } from "../services/orderReadCancel.js";

/**
 * Runs one cleanup pass (bounded batches).
 */
export async function runStaleOrderCancellationOnce(): Promise<void> {
  const { orderCancelAfterMinutes } = await getCheckoutDefaults();
  const cutoff = new Date(Date.now() - orderCancelAfterMinutes * 60_000);
  const stale = await prisma.order.findMany({
    where: {
      status: "PLACED",
      paymentMethod: "RAZORPAY",
      placedAt: { lt: cutoff },
    },
    select: { orderNumber: true },
    take: 100,
  });
  for (const o of stale) {
    try {
      await systemAutoCancelUnpaidOrder(o.orderNumber);
    } catch (err) {
      logger.error({ err, orderNumber: o.orderNumber }, "Auto-cancel single order failed");
    }
  }
}