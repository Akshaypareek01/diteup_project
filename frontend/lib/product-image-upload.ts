import { ApiError, clientApiJson } from "@/lib/client-api";

export const MAX_PRODUCT_IMAGES = 8;
export const MAX_PRODUCT_IMAGE_BYTES = 8 * 1024 * 1024;

const ALLOWED_CONTENT_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export type PresignProductImageResponse = {
  uploadUrl: string;
  publicUrl: string;
  key: string;
  expiresIn: number;
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
 * Presign + PUT one file to R2, then return the public URL for `POST .../media`.
 */
export async function presignAndUploadProductImage(productId: string, file: File): Promise<string> {
  const contentType = file.type || "image/jpeg";
  if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
    throw new Error("Unsupported image type.");
  }

  const path = `/v1/admin/products/${encodeURIComponent(productId)}/media/upload-url`;
  const presign = await clientApiJson<PresignProductImageResponse>(path, {
    method: "POST",
    json: { contentType },
  });

  try {
    const putRes = await fetch(presign.uploadUrl, {
      method: "PUT",
      headers: { "Content-Type": contentType },
      body: file,
    });
    if (!putRes.ok) {
      const snippet = await putRes.text().catch(() => "");
      throw new ApiError(putRes.status, `Image upload failed (${putRes.status}).`, snippet);
    }
  } catch (e) {
    if (e instanceof ApiError) throw e;
    if (e instanceof Error) throw e;
    throw new Error("Image upload failed.");
  }

  return presign.publicUrl;
}
