/**
 * Object storage service — Cloudflare R2 / AWS S3 compatible.
 *
 * Behaviour:
 *  - When R2_ENDPOINT + R2_ACCESS_KEY_ID + R2_SECRET_ACCESS_KEY + R2_BUCKET are set,
 *    generates presigned PUT URLs for direct client uploads (CORS must be configured
 *    on the bucket to accept browser PUTs).
 *  - When credentials are not set, `presignUpload` returns null so the caller can
 *    short-circuit with a clear 503 (storage not configured).
 *
 * Key layout convention (see also PRD §6.7.4):
 *   r2://diteup-media/avatars/{userId}/{uuid}.{ext}
 *   r2://diteup-media/reviews/{reviewId}/{uuid}.{ext}
 *   r2://diteup-media/products/{productId}/{uuid}.{ext}
 */
import { randomUUID } from "node:crypto";
import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";

const hasStorageConfig =
  !!env.R2_ENDPOINT &&
  !!env.R2_ACCESS_KEY_ID &&
  !!env.R2_SECRET_ACCESS_KEY &&
  !!env.R2_BUCKET;

const client: S3Client | null = hasStorageConfig
  ? new S3Client({
      region: "auto",
      endpoint: env.R2_ENDPOINT,
      credentials: {
        accessKeyId: env.R2_ACCESS_KEY_ID!,
        secretAccessKey: env.R2_SECRET_ACCESS_KEY!,
      },
      forcePathStyle: true,
    })
  : null;

if (!hasStorageConfig) {
  logger.warn("Storage (R2/S3) not configured — upload endpoints will return 503");
}

const CONTENT_TYPE_TO_EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/heic": "heic",
  "image/heif": "heif",
};

export type PresignResult = {
  uploadUrl: string;       // PUT here (with the same content-type header)
  publicUrl: string;        // permanent read URL after upload
  key: string;              // bucket key
  expiresIn: number;        // seconds
};

/**
 * Generate a presigned PUT URL for direct client upload.
 * Returns `null` if storage is not configured — caller should 503.
 */
export async function presignUpload(args: {
  scope: "avatars" | "reviews" | "products";
  ownerId: string;          // userId, reviewId, or productId
  contentType: keyof typeof CONTENT_TYPE_TO_EXT | string;
  expiresIn?: number;       // default 5 minutes
}): Promise<PresignResult | null> {
  if (!client || !hasStorageConfig) return null;

  const ext = CONTENT_TYPE_TO_EXT[args.contentType] ?? "bin";
  const key = `${args.scope}/${args.ownerId}/${randomUUID()}.${ext}`;
  const expiresIn = args.expiresIn ?? 300;

  const command = new PutObjectCommand({
    Bucket: env.R2_BUCKET!,
    Key: key,
    ContentType: args.contentType,
  });

  const uploadUrl = await getSignedUrl(client, command, { expiresIn });
  const publicUrl = buildPublicUrl(key);

  return { uploadUrl, publicUrl, key, expiresIn };
}

/** Build the permanent read URL for an uploaded key. */
export function buildPublicUrl(key: string): string {
  // R2 public URLs use the public dev domain or a custom CNAME.
  // Configure CDN_BASE in the future; for now derive from endpoint.
  const base = env.R2_ENDPOINT?.replace(/\/$/, "") ?? "";
  return `${base}/${env.R2_BUCKET}/${key}`;
}

/**
 * Server-side upload (invoices, derivatives). Returns public URL or null when storage is disabled.
 */
export async function uploadPublicBuffer(args: {
  key: string;
  buffer: Buffer;
  contentType: string;
}): Promise<string | null> {
  if (!client || !hasStorageConfig) return null;
  await client.send(
    new PutObjectCommand({
      Bucket: env.R2_BUCKET!,
      Key: args.key,
      Body: args.buffer,
      ContentType: args.contentType,
    }),
  );
  return buildPublicUrl(args.key);
}

export const isStorageConfigured = hasStorageConfig;
