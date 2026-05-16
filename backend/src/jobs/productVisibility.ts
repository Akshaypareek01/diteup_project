/**
 * Applies scheduled visibility windows (PRD §10.3, every ~5 min).
 */
import { prisma } from "../utils/prisma.js";
import { logger } from "../utils/logger.js";

/**
 * Publishes `COMING_SOON` when `availableFrom` has passed; hides `PUBLISHED` when `availableUntil` passed.
 */
export async function runProductVisibilityScheduleOnce(): Promise<{
  published: number;
  hidden: number;
}> {
  const now = new Date();

  const pub = await prisma.product.updateMany({
    where: {
      visibility: "COMING_SOON",
      availableFrom: { lte: now },
      OR: [{ availableUntil: null }, { availableUntil: { gt: now } }],
    },
    data: { visibility: "PUBLISHED" },
  });

  const hid = await prisma.product.updateMany({
    where: {
      visibility: { in: ["PUBLISHED", "COMING_SOON"] },
      availableUntil: { lte: now },
    },
    data: { visibility: "HIDDEN" },
  });

  if (pub.count > 0 || hid.count > 0) {
    logger.info({ published: pub.count, hidden: hid.count }, "product visibility schedule tick");
  }

  return { published: pub.count, hidden: hid.count };
}
