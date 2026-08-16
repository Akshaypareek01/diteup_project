import { clientApiUploadFile } from "@/lib/client-api";

export const MAX_PRODUCT_IMAGES = 8;
export const MAX_PRODUCT_IMAGE_BYTES = 8 * 1024 * 1024;

const ALLOWED_CONTENT_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export type UploadedProductImage = {
  publicUrl: string;
  key: string;
};

/**
 * Returns a user-facing validation error, or `null` when the file list is acceptable.
 */
export function validateProductImageFiles(files: File[], alreadyUploaded: number): string | null {
  if (files.length < 1) {
    return "Choose at least one image.";
  }
  if (alreadyUploaded + files.length > MAX_PRODUCT_IMAGES) {
    const remaining = Math.max(0, MAX_PRODUCT_IMAGES - alreadyUploaded);
    return remaining === 0
      ? `Maximum ${MAX_PRODUCT_IMAGES} images per product.`
      : `You can add ${remaining} more image${remaining === 1 ? "" : "s"} (max ${MAX_PRODUCT_IMAGES}).`;
  }
  for (const file of files) {
    const ct = file.type || "";
    if (!ALLOWED_CONTENT_TYPES.has(ct)) {
      return "Use JPEG, PNG, or WebP images only.";
    }
    if (file.size > MAX_PRODUCT_IMAGE_BYTES) {
      return "Each image must be 8MB or smaller.";
    }
  }
  return null;
}

/**
 * POST the file to the API, which writes it to R2 (no browser CORS).
 */
export async function presignAndUploadProductImage(productId: string, file: File): Promise<string> {
  const contentType = file.type || "image/jpeg";
  if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
    throw new Error("Unsupported image type.");
  }
  const path = `/v1/admin/products/${encodeURIComponent(productId)}/media/upload`;
  const stored = await clientApiUploadFile<UploadedProductImage>(path, file);
  return stored.publicUrl;
}
