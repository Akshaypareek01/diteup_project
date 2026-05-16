import { ApiError, clientApiJson } from "@/lib/client-api";

export const MAX_REVIEW_IMAGES = 5;
export const MAX_REVIEW_IMAGE_BYTES = 5 * 1024 * 1024;

const ALLOWED_CONTENT_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/heic",
  "image/heif",
]);

export type PresignReviewImageResponse = {
  uploadUrl: string;
  publicUrl: string;
  key: string;
  expiresIn: number;
};

/**
 * Returns a user-facing validation error, or `null` when the file list is acceptable.
 */
export function validateReviewImageFiles(files: File[]): string | null {
  if (files.length > MAX_REVIEW_IMAGES) {
    return `You can attach at most ${MAX_REVIEW_IMAGES} photos.`;
  }
  for (const file of files) {
    const ct = file.type || "";
    if (!ALLOWED_CONTENT_TYPES.has(ct)) {
      return "Use JPEG, PNG, WebP, or HEIC images only.";
    }
    if (file.size > MAX_REVIEW_IMAGE_BYTES) {
      return "Each photo must be 5MB or smaller.";
    }
  }
  return null;
}

/**
 * For each file: presign with the API, PUT bytes to object storage, collect public URLs for `PUT /v1/reviews/:id`.
 */
export async function presignAndUploadReviewImages(reviewId: string, files: File[]): Promise<string[]> {
  const publicUrls: string[] = [];
  for (const file of files) {
    const contentType = file.type || "image/jpeg";
    if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
      throw new Error("Unsupported image type.");
    }

    const presign = await clientApiJson<PresignReviewImageResponse>("/v1/reviews/images/upload-url", {
      method: "POST",
      json: { reviewId, contentType },
    });

    try {
      const putRes = await fetch(presign.uploadUrl, {
        method: "PUT",
        headers: { "Content-Type": contentType },
        body: file,
      });
      if (!putRes.ok) {
        const snippet = await putRes.text().catch(() => "");
        throw new ApiError(putRes.status, `Photo upload failed (${putRes.status}).`, snippet);
      }
    } catch (e) {
      if (e instanceof ApiError) throw e;
      if (e instanceof Error) throw e;
      throw new Error("Photo upload failed.");
    }

    publicUrls.push(presign.publicUrl);
  }
  return publicUrls;
}
