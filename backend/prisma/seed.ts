/**
 * Dev seed — one admin (`Role.ADMIN`) + one publishable SKU with inventory (`TASKS.md` §1.11).
 * Idempotent per email / product slug except admin password refresh on upsert update.
 *
 * Requires `DATABASE_URL`. Optional: `SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD` (must pass `isStrongPassword`).
 */
import "dotenv/config";
import { Prisma, PrismaClient, Role, StockReason } from "@prisma/client";

import { hashPassword, isStrongPassword } from "../src/utils/password.js";

const prisma = new PrismaClient();

const SEED_PRODUCT_SLUG = "energy-bite-750g";
const DEFAULT_ADMIN_EMAIL = "admin@diteup.local";
const DEFAULT_ADMIN_PASSWORD = "DiteUpAdmin123";

/**
 * Applies catalog + admin fixtures for empty local databases.
 */
async function seed(): Promise<void> {
  const adminEmail =
    typeof process.env.SEED_ADMIN_EMAIL === "string" && process.env.SEED_ADMIN_EMAIL.trim()
      ? process.env.SEED_ADMIN_EMAIL.trim().toLowerCase()
      : DEFAULT_ADMIN_EMAIL;
  let adminPass =
    typeof process.env.SEED_ADMIN_PASSWORD === "string" && process.env.SEED_ADMIN_PASSWORD.trim()
      ? process.env.SEED_ADMIN_PASSWORD.trim()
      : DEFAULT_ADMIN_PASSWORD;
  if (!isStrongPassword(adminPass)) {
    throw new Error(
      "SEED_ADMIN_PASSWORD must be ≥8 chars with at least one letter and one number (see password rules).",
    );
  }

  const usingDefaultPw = !process.env.SEED_ADMIN_PASSWORD?.trim();

  const passwordHash = await hashPassword(adminPass);

  const user = await prisma.user.upsert({
    where: { email: adminEmail },
    create: {
      email: adminEmail,
      passwordHash,
      name: "Seed Admin",
      role: Role.ADMIN,
      emailVerified: true,
      emailVerifiedAt: new Date(),
    },
    update: {
      passwordHash,
      role: Role.ADMIN,
      emailVerified: true,
      emailVerifiedAt: new Date(),
      name: "Seed Admin",
    },
  });

  const existingProduct = await prisma.product.findUnique({ where: { slug: SEED_PRODUCT_SLUG } });
  if (!existingProduct) {
    const initialStock = 200;
    await prisma.product.create({
      data: {
        slug: SEED_PRODUCT_SLUG,
        name: "Energy Bite 750g",
        description:
          "High-energy snack for local/dev testing — seed-only description. Swap for real PDP copy.",
        shortDesc: "750 g pack • seed SKU",
        isFeatured: true,
        visibility: "PUBLISHED",
        gstRate: new Prisma.Decimal("5"),

        variants: {
          create: [
            {
              sku: "EB-750G-DEFAULT",
              name: "750 g — pack",
              priceMrp: new Prisma.Decimal("999.00"),
              priceSale: new Prisma.Decimal("749.00"),
              weightGm: 750,
              isDefault: true,
              isActive: true,
              inventory: {
                create: {
                  stockOnHand: initialStock,
                  stockReserved: 0,
                  lowStockThreshold: 25,
                  history: {
                    create: {
                      delta: initialStock,
                      reason: StockReason.INITIAL,
                      note: "prisma seed",
                    },
                  },
                },
              },
            },
          ],
        },
        media: {
          create: {
            type: "IMAGE",
            url: "https://placehold.co/960x960/28432c/edc982?text=Energy+Bite",
            altText: "Energy Bite 750g (placeholder)",
            order: 0,
          },
        },
      },
    });
  }

  // eslint-disable-next-line no-console
  console.info(
    [
      "✔ Seed finished.",
      usingDefaultPw
        ? `  ⚠ Using default DEV password (set SEED_ADMIN_PASSWORD to override). Matches DEFAULT_ADMIN_PASSWORD in prisma/seed.ts.`
        : "  Credentials from SEED_ADMIN_PASSWORD (not echoed).",
      `  Admin login: ${adminEmail}`,
      `  Admin id: ${user.id}`,
      `  Product slug: ${SEED_PRODUCT_SLUG} (${existingProduct ? "already present, skipped insert" : "created"})`,
    ].join("\n"),
  );
}

seed()
  .catch((e: unknown) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
