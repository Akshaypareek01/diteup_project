/**
 * Public product review listing + aggregate summary (PRD §6.7.5, TASK 7.9).
 */
import { Prisma } from "@prisma/client";

import { prisma } from "../utils/prisma.js";
import { NotFound } from "../utils/errors.js";

const publicReviewWhere = {
  isApproved: true,
  deletedAt: null,
  isFlagged: false,
} as const;

function emptySummary() {
  return {
    averageRating: 0,
    totalCount: 0,
    distribution: { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 } as Record<number, number>,
  };
}

/**
 * Paginated approved reviews + summary (computed each request).
 */
export async function listPublicReviewsForSlug(input: {
  slug: string;
  sort: "recent" | "helpful";
  rating?: number;
  withImages?: boolean;
  page: number;
  pageSize: number;
}) {
  const product = await prisma.product.findUnique({
    where: { slug: input.slug },
    select: { id: true, reviewsEnabled: true },
  });
  if (!product) throw NotFound("Product not found");
  if (!product.reviewsEnabled) {
    return {
      productId: product.id,
      summary: emptySummary(),
      reviews: [] as const,
      page: input.page,
      pageSize: input.pageSize,
      total: 0,
    };
  }

  const where: Prisma.ReviewWhereInput = {
    productId: product.id,
    ...publicReviewWhere,
    ...(input.rating != null ? { rating: input.rating } : {}),
    ...(input.withImages ? { hasImages: true } : {}),
  };

  const orderBy: Prisma.ReviewOrderByWithRelationInput[] =
    input.sort === "helpful"
      ? [{ helpfulCount: "desc" }, { createdAt: "desc" }]
      : [{ createdAt: "desc" }];

  const [total, rows, agg, dist] = await prisma.$transaction([
    prisma.review.count({ where }),
    prisma.review.findMany({
      where,
      orderBy,
      skip: (input.page - 1) * input.pageSize,
      take: input.pageSize,
      select: {
        id: true,
        authorName: true,
        rating: true,
        title: true,
        body: true,
        images: true,
        hasImages: true,
        isVerified: true,
        helpfulCount: true,
        adminReply: true,
        adminReplyAt: true,
        createdAt: true,
        editedAt: true,
      },
    }),
    prisma.review.aggregate({
      where: { productId: product.id, ...publicReviewWhere },
      _avg: { rating: true },
      _count: true,
    }),
    prisma.review.groupBy({
      by: ["rating"],
      where: { productId: product.id, ...publicReviewWhere },
      _count: true,
    }),
  ]);

  const distribution: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  for (const d of dist) {
    if (d.rating >= 1 && d.rating <= 5) {
      distribution[d.rating as 1 | 2 | 3 | 4 | 5] = d._count;
    }
  }

  return {
    productId: product.id,
    summary: {
      averageRating: agg._avg.rating != null ? Math.round(agg._avg.rating * 100) / 100 : 0,
      totalCount: agg._count,
      distribution,
    },
    reviews: rows,
    page: input.page,
    pageSize: input.pageSize,
    total,
  };
}
