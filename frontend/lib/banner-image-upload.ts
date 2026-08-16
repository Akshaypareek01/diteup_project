import { clientApiUploadFile } from "@/lib/client-api";

export const MAX_BANNER_IMAGE_BYTES = 8 * 1024 * 1024;

const ALLOWED_CONTENT_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export type UploadedBannerImage = {
  publicUrl: string;
  key: string;
};

/**
 * Returns a user-facing validation error, or `null` when the file is acceptable.
 */
export function validateBannerImageFile(file: File): string | null {
  const ct = file.type || "";
  if (!ALLOWED_CONTENT_TYPES.has(ct)) {
    return "Use JPEG, PNG, or WebP only.";
  }
  if (file.size > MAX_BANNER_IMAGE_BYTES) {
    return "Each banner must be 8MB or smaller.";
  }
  return null;
}

/**
 * POST the file to the API, which writes it to R2 (no browser CORS).
 */
export async function presignAndUploadBannerImage(file: File): Promise<string> {
  const contentType = file.type || "image/jpeg";
  if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
    throw new Error("Unsupported image type.");
  }
  const stored = await clientApiUploadFile<UploadedBannerImage>("/v1/admin/banners/upload", file);
  return stored.publicUrl;
}
