import { ApiError, clientApiJson } from "@/lib/client-api";

export const MAX_BANNER_IMAGE_BYTES = 8 * 1024 * 1024;

const ALLOWED_CONTENT_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

export type PresignBannerImageResponse = {
  uploadUrl: string;
  publicUrl: string;
  key: string;
  expiresIn: number;
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
 * Presign + PUT a homepage banner image to R2, then return the public URL.
 */
export async function presignAndUploadBannerImage(file: File): Promise<string> {
  const contentType = file.type || "image/jpeg";
  if (!ALLOWED_CONTENT_TYPES.has(contentType)) {
    throw new Error("Unsupported image type.");
  }

  const presign = await clientApiJson<PresignBannerImageResponse>("/v1/admin/banners/upload-url", {
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
      throw new ApiError(putRes.status, `Banner upload failed (${putRes.status}).`, snippet);
    }
  } catch (e) {
    if (e instanceof ApiError) throw e;
    if (e instanceof Error) throw e;
    throw new Error("Banner upload failed.");
  }

  return presign.publicUrl;
}
