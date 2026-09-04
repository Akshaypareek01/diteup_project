/**
 * Uploads `dietupreview/` customer photos to R2 and inserts approved photo reviews.
 * Newest `createdAt` so they sit on top of sort=recent. Idempotent by authorName.
 *
 * From backend/:
 *   npx tsx scripts/seed-review-photos.ts --dry-run
 *   npx tsx scripts/seed-review-photos.ts --yes
 *
 * Production: set `DATABASE_URL` + R2 env in `.env`, scp/git the `dietupreview` folder,
 * then the same `--yes` command. Optional `--dir /path/to/dietupreview`.
 */
import "dotenv/config";
import fs from "node:fs";
import path from "node:path";

import { PrismaClient } from "@prisma/client";

import { isStorageConfigured, uploadScopedObject } from "../src/services/storage.js";
import { PHOTO_REVIEW_COPY } from "./seed-review-photos-copy.js";

const prisma = new PrismaClient();
const DEFAULT_SLUG = "energy-bite-750g";
const DEFAULT_DIR = path.resolve(process.cwd(), "../dietupreview");

type Args = {
  slug: string;
  dir: string;
  yes: boolean;
  dryRun: boolean;
  force: boolean;
};

/**
 * Parses CLI flags for the photo-review seeder.
 *
 * @param argv process.argv
 */
function parseArgs(argv: string[]): Args {
  let slug = process.env.REVIEW_SEED_SLUG?.trim() || DEFAULT_SLUG;
  let dir = process.env.REVIEW_PHOTO_DIR?.trim() || DEFAULT_DIR;
  let yes = false;
  let dryRun = false;
  let force = false;
  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === "--yes") yes = true;
    else if (a === "--dry-run") dryRun = true;
    else if (a === "--force") force = true;
    else if (a === "--slug") {
      const next = argv[++i];
      if (!next) throw new Error("--slug requires a value");
      slug = next.trim();
    } else if (a === "--dir") {
      const next = argv[++i];
      if (!next) throw new Error("--dir requires a value");
      dir = path.resolve(next.trim());
    } else {
      throw new Error(`Unknown arg: ${a}`);
    }
  }
  return { slug, dir, yes, dryRun, force };
}

/**
 * JPEG/PNG/WebP files in the photo folder, sorted by name.
 *
 * @param dir absolute folder path
 */
function listPhotoFiles(dir: string): string[] {
  if (!fs.existsSync(dir)) {
    throw new Error(`Photo folder not found: ${dir}`);
  }
  return fs
    .readdirSync(dir)
    .filter((name) => /\.(jpe?g|png|webp)$/i.test(name))
    .sort((a, b) => a.localeCompare(b))
    .map((name) => path.join(dir, name));
}

/**
 * Seeds (or refreshes) photo reviews for one product.
 */
async function main(): Promise<void> {
  const args = parseArgs(process.argv);
  const files = listPhotoFiles(args.dir);
  const copyByFile = new Map(PHOTO_REVIEW_COPY.map((row) => [row.fileName, row]));

  const product = await prisma.product.findUnique({
    where: { slug: args.slug },
    select: { id: true, name: true, slug: true, reviewsEnabled: true },
  });
  if (!product) throw new Error(`No product with slug "${args.slug}"`);
  if (!product.reviewsEnabled) {
    throw new Error(`Reviews are disabled on ${args.slug} — enable them in admin first.`);
  }
  if (!isStorageConfigured) {
    throw new Error("R2 is not configured (R2_ENDPOINT / keys / bucket). Photo seed needs object storage.");
  }

  const planned = files.map((filePath, index) => {
    const fileName = path.basename(filePath);
    const copy = copyByFile.get(fileName);
    if (!copy) {
      throw new Error(`No Hinglish copy mapped for ${fileName} — add it to seed-review-photos-copy.ts`);
    }
    const createdAt = new Date(Date.now() - index * 90 * 1000);
    return { filePath, fileName, copy, createdAt };
  });

  console.log(
    JSON.stringify(
      {
        slug: product.slug,
        dir: args.dir,
        photos: planned.map((p) => ({ file: p.fileName, author: p.copy.authorName })),
        dryRun: args.dryRun,
        force: args.force,
      },
      null,
      2,
    ),
  );

  if (args.dryRun) return;
  if (!args.yes) {
    throw new Error("Refusing to write without --yes (use --dry-run to preview).");
  }

  let upserted = 0;
  for (const row of planned) {
    const existing = await prisma.review.findFirst({
      where: { productId: product.id, userId: null, authorName: row.copy.authorName },
      select: { id: true, hasImages: true },
    });

    const review =
      existing ??
      (await prisma.review.create({
        data: {
          productId: product.id,
          userId: null,
          orderId: null,
          authorName: row.copy.authorName,
          rating: row.copy.rating,
          title: row.copy.title,
          body: row.copy.body,
          images: [],
          hasImages: false,
          isApproved: true,
          isVerified: true,
          isFeatured: true,
          isFlagged: false,
          helpfulCount: 18,
          createdAt: row.createdAt,
        },
        select: { id: true, hasImages: true },
      }));

    if (existing && existing.hasImages && !args.force) {
      await prisma.review.update({
        where: { id: review.id },
        data: {
          title: row.copy.title,
          body: row.copy.body,
          rating: row.copy.rating,
          isApproved: true,
          isVerified: true,
          isFeatured: true,
          createdAt: row.createdAt,
        },
      });
      upserted += 1;
      continue;
    }

    const buffer = fs.readFileSync(row.filePath);
    const stored = await uploadScopedObject({
      scope: "reviews",
      ownerId: review.id,
      contentType: "image/jpeg",
      buffer,
    });
    if (!stored) {
      throw new Error(`R2 upload failed for ${row.fileName}`);
    }

    const image = {
      url: stored.publicUrl,
      full: stored.publicUrl,
      medium: stored.publicUrl,
      thumb: stored.publicUrl,
    };

    await prisma.review.update({
      where: { id: review.id },
      data: {
        title: row.copy.title,
        body: row.copy.body,
        rating: row.copy.rating,
        images: [image],
        hasImages: true,
        isApproved: true,
        isVerified: true,
        isFeatured: true,
        helpfulCount: 18,
        createdAt: row.createdAt,
      },
    });
    upserted += 1;
  }

  console.log(`Upserted ${upserted} photo reviews.`);
}

main()
  .catch((err) => {
    console.error(err instanceof Error ? err.message : err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
