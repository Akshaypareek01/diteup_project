/**
 * Inserts approved public reviews for a product (Indian names, positive Energy Bite copy).
 *
 * Idempotent: skips `authorName` already present on that product (userId null).
 *
 * Usage (from backend/):
 *   npx tsx scripts/seed-product-reviews.ts --slug energy-bite-750g --count 150 --dry-run
 *   npx tsx scripts/seed-product-reviews.ts --slug energy-bite-750g --count 150 --yes
 *
 * Production: same command with production `DATABASE_URL` in `.env`. Always pass `--yes`.
 */
import "dotenv/config";
import { PrismaClient } from "@prisma/client";

import {
  BODY_TEMPLATES,
  CITIES,
  FIRST_NAMES,
  LAST_NAMES,
  TITLES_4,
  TITLES_5,
} from "./seed-product-reviews-copy.js";

const prisma = new PrismaClient();
const BODY_MIN = 20;
const DEFAULT_SLUG = "energy-bite-750g";
const DEFAULT_COUNT = 150;

type Args = {
  slug: string;
  count: number;
  yes: boolean;
  dryRun: boolean;
};

/**
 * Parses `--slug`, `--count`, `--yes`, `--dry-run` from argv.
 *
 * @param argv process.argv
 */
function parseArgs(argv: string[]): Args {
  let slug = process.env.REVIEW_SEED_SLUG?.trim() || DEFAULT_SLUG;
  let count = DEFAULT_COUNT;
  let yes = false;
  let dryRun = false;
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--yes") yes = true;
    else if (a === "--dry-run") dryRun = true;
    else if (a === "--slug") {
      const next = argv[++i];
      if (!next) throw new Error("--slug requires a value");
      slug = next.trim();
    } else if (a === "--count") {
      const next = argv[++i];
      const n = Number(next);
      if (!Number.isInteger(n) || n < 1 || n > 500) {
        throw new Error("--count must be an integer 1–500");
      }
      count = n;
    } else {
      throw new Error(`Unknown arg: ${a}`);
    }
  }
  return { slug, count, yes, dryRun };
}

/**
 * Seeded RNG so re-runs pick the same name order (idempotent skips stay stable).
 *
 * @param seed integer seed
 */
function mulberry32(seed: number): () => number {
  return () => {
    let t = (seed += 0x6d2b79f5);
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Builds `count` unique "First Last" display names.
 *
 * @param count how many names
 */
function buildIndianNames(count: number): string[] {
  const names: string[] = [];
  for (const first of FIRST_NAMES) {
    for (const last of LAST_NAMES) {
      names.push(`${first} ${last}`);
      if (names.length >= count) return names;
    }
  }
  throw new Error(`Need ${count} names; only generated ${names.length}. Add more first/last names.`);
}

/**
 * Fills a body template; retries until length ≥ 20.
 *
 * @param index review index
 * @param authorName reviewer name
 * @param productName catalog product name
 * @param rng unit random
 */
function buildBody(
  index: number,
  authorName: string,
  productName: string,
  rng: () => number,
): string {
  const city = CITIES[index % CITIES.length]!;
  const tpl = BODY_TEMPLATES[index % BODY_TEMPLATES.length]!;
  const first = authorName.split(" ")[0] ?? "I";
  let body = tpl
    .replaceAll("{name}", first)
    .replaceAll("{city}", city)
    .replaceAll("{product}", productName);
  if (body.length < BODY_MIN) {
    body = `${body} Happy with DiteUp overall.`;
  }
  if (rng() > 0.7) {
    body += " Would recommend to friends.";
  }
  return body.slice(0, 2000);
}

/**
 * Seeds approved reviews onto one product.
 */
async function main(): Promise<void> {
  const args = parseArgs(process.argv);
  const product = await prisma.product.findUnique({
    where: { slug: args.slug },
    select: { id: true, name: true, slug: true, reviewsEnabled: true },
  });
  if (!product) {
    throw new Error(`No product with slug "${args.slug}"`);
  }
  if (!product.reviewsEnabled) {
    throw new Error(`Reviews are disabled on ${args.slug} — enable them in admin first.`);
  }

  const existing = await prisma.review.findMany({
    where: { productId: product.id, userId: null },
    select: { authorName: true },
  });
  const taken = new Set(existing.map((r) => r.authorName));
  const rng = mulberry32(20260901);
  const names = buildIndianNames(args.count);
  const planned: Array<{
    authorName: string;
    rating: number;
    title: string | null;
    body: string;
    isVerified: boolean;
    isFeatured: boolean;
    helpfulCount: number;
    createdAt: Date;
  }> = [];

  const now = Date.now();
  for (let i = 0; i < names.length; i++) {
    const authorName = names[i]!;
    if (taken.has(authorName)) continue;
    const rating = i % 5 === 0 ? 4 : 5;
    const titles = rating === 4 ? TITLES_4 : TITLES_5;
    const title = titles[i % titles.length] ?? null;
    const daysAgo = Math.floor(rng() * 160) + 1;
    const createdAt = new Date(now - daysAgo * 24 * 60 * 60 * 1000 - Math.floor(rng() * 12 * 60 * 60 * 1000));
    planned.push({
      authorName,
      rating,
      title,
      body: buildBody(i, authorName, product.name, rng),
      isVerified: rng() > 0.35,
      isFeatured: planned.length < 6,
      helpfulCount: Math.floor(rng() * 22),
      createdAt,
    });
  }

  const toInsert = planned;
  console.log(
    JSON.stringify(
      {
        slug: product.slug,
        name: product.name,
        existingGuestReviews: taken.size,
        wouldInsert: toInsert.length,
        dryRun: args.dryRun,
      },
      null,
      2,
    ),
  );

  if (args.dryRun) return;
  if (!args.yes) {
    throw new Error("Refusing to write without --yes (use --dry-run to preview).");
  }
  if (toInsert.length === 0) {
    console.log("Nothing to insert — names already present.");
    return;
  }

  const batchSize = 25;
  let inserted = 0;
  for (let i = 0; i < toInsert.length; i += batchSize) {
    const chunk = toInsert.slice(i, i + batchSize);
    await prisma.review.createMany({
      data: chunk.map((r) => ({
        productId: product.id,
        userId: null,
        orderId: null,
        authorName: r.authorName,
        rating: r.rating,
        title: r.title,
        body: r.body,
        images: undefined,
        hasImages: false,
        isApproved: true,
        isVerified: r.isVerified,
        isFeatured: r.isFeatured,
        isFlagged: false,
        helpfulCount: r.helpfulCount,
        createdAt: r.createdAt,
      })),
    });
    inserted += chunk.length;
  }
  console.log(`Inserted ${inserted} reviews.`);
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
