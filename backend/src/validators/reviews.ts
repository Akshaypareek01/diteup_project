/**
 * Zod schemas for customer reviews (PRD §6.7).
 */
import { z } from "zod";

const ImageMime = z.enum(["image/jpeg", "image/png", "image/webp", "image/heic", "image/heif"]);

const ReviewImageSchema = z
  .object({
    url: z.string().url().optional(),
    thumb: z.string().url().optional(),
    medium: z.string().url().optional(),
    full: z.string().url().optional(),
  })
  .refine((o) => Boolean(o.url || o.thumb || o.medium || o.full), {
    message: "Each image needs at least one URL field",
  });

export const CreateReviewBodySchema = z.object({
  productId: z.string().min(10),
  orderId: z.string().min(10),
  anonymous: z.boolean().optional().default(false),
  rating: z.number().int().min(1).max(5),
  title: z.string().max(120).optional().nullable(),
  body: z.string().min(20).max(2000),
  displayName: z.string().max(120).optional().nullable(),
  images: z.array(ReviewImageSchema).max(5).optional(),
});

export const UpdateReviewBodySchema = z
  .object({
    anonymous: z.boolean().optional(),
    rating: z.number().int().min(1).max(5).optional(),
    title: z.string().max(120).optional().nullable(),
    body: z.string().min(20).max(2000).optional(),
    displayName: z.string().max(120).optional().nullable(),
    images: z.array(ReviewImageSchema).max(5).optional(),
  })
  .refine(
    (v) =>
      v.anonymous !== undefined ||
      v.rating !== undefined ||
      v.title !== undefined ||
      v.body !== undefined ||
      v.displayName !== undefined ||
      v.images !== undefined,
    { message: "Provide at least one field to update" },
  );

export const ReviewIdParamSchema = z.object({
  id: z.string().min(10),
});

export const PresignReviewImageSchema = z.object({
  reviewId: z.string().min(10),
  contentType: ImageMime,
});

export const FlagReviewBodySchema = z.object({
  reason: z.string().trim().min(3).max(500),
});

export const ProductReviewsQuerySchema = z.object({
  sort: z.enum(["recent", "helpful"]).optional().default("recent"),
  rating: z.coerce.number().int().min(1).max(5).optional(),
  withImages: z
    .string()
    .optional()
    .transform((v) => (v === undefined ? undefined : v === "true")),
  page: z.coerce.number().int().min(1).optional().default(1),
  pageSize: z.coerce.number().int().min(1).max(30).optional().default(10),
});

export type ProductReviewsQueryInput = z.infer<typeof ProductReviewsQuerySchema>;
