/**
 * Sends back-in-stock emails to pending waiters for one variant (shared by admin + batch jobs).
 */
import { backInStockEmail } from "../emails/templates.js";
import { prisma } from "../utils/prisma.js";
import { sendEmail } from "./email.js";

export type NotifyWaitlistResult = {
  notified: number;
  skipped: number;
  /** Set when the variant cannot be notified (batch should skip quietly). */
  blockedReason?: "not_found" | "no_inventory" | "no_stock";
};

/**
 * Notifies all pending `StockNotification` rows for a variant when sellable qty &gt; 0.
 */
export async function notifyPendingWaitlistForVariant(variantId: string): Promise<NotifyWaitlistResult> {
  const variant = await prisma.productVariant.findUnique({
    where: { id: variantId },
    include: {
      product: { select: { name: true } },
      inventory: true,
    },
  });
  if (!variant) return { notified: 0, skipped: 0, blockedReason: "not_found" };
  const inv = variant.inventory;
  if (!inv) return { notified: 0, skipped: 0, blockedReason: "no_inventory" };

  const available = inv.stockOnHand - inv.stockReserved;
  if (available <= 0) {
    return { notified: 0, skipped: 0, blockedReason: "no_stock" };
  }

  const waiters = await prisma.stockNotification.findMany({
    where: { variantId, notifiedAt: null },
  });

  let notified = 0;
  let skipped = 0;
  const tpl = backInStockEmail({
    productName: variant.product.name,
    variantName: variant.name,
  });

  for (const w of waiters) {
    const r = await sendEmail({
      to: w.email,
      subject: tpl.subject,
      html: tpl.html,
      text: tpl.text,
      template: "back_in_stock",
      refType: "VARIANT",
      refId: variant.id,
    });
    if (r.ok && !r.suppressed) {
      await prisma.stockNotification.update({
        where: { id: w.id },
        data: { notifiedAt: new Date() },
      });
      notified += 1;
    } else {
      skipped += 1;
    }
  }

  return { notified, skipped };
}

/**
 * Returns distinct variant ids that still have pending waitlist entries.
 */
export async function listVariantsWithPendingStockNotifications(): Promise<string[]> {
  const rows = await prisma.stockNotification.findMany({
    where: { notifiedAt: null },
    distinct: ["variantId"],
    select: { variantId: true },
  });
  return rows.map((r) => r.variantId);
}
