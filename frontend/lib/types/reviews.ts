/** Public payloads from `GET /v1/products/:slug/reviews`. */

export type PublicReviewDistribution = Record<1 | 2 | 3 | 4 | 5, number>;

export type PublicReviewSummary = {
  averageRating: number;
  totalCount: number;
  distribution: PublicReviewDistribution;
};

export type PublicReviewItem = {
  id: string;
  authorName: string;
  rating: number;
  title?: string | null;
  body: string;
  images?: unknown;
  hasImages?: boolean;
  isVerified: boolean;
  helpfulCount?: number;
  adminReply?: string | null;
  adminReplyAt?: string | null;
  createdAt: string;
};

export type ProductReviewsPayload = {
  productId: string;
  summary: PublicReviewSummary;
  reviews: PublicReviewItem[];
  page: number;
  pageSize: number;
  total: number;
};
