/**
 * AES-256-GCM helpers for encrypting JSON setting values marked as secret (PRD §8.10).
 */
import { createCipheriv, createDecipheriv, createHash, randomBytes } from "node:crypto";

import { env } from "../config/env.js";
import { ValidationError } from "./errors.js";

const ALGO = "aes-256-gcm";
const IV_LEN = 16;
const AUTH_TAG_LEN = 16;

function deriveKey(secret: string): Buffer {
  return createHash("sha256").update(secret, "utf8").digest();
}

/**
 * Returns true when `SETTINGS_ENCRYPTION_KEY` is set (≥ 16 chars recommended).
 */
export function isSettingsEncryptionConfigured(): boolean {
  return Boolean(env.SETTINGS_ENCRYPTION_KEY && env.SETTINGS_ENCRYPTION_KEY.length >= 16);
}

/**
 * Encrypts a UTF-8 string; output format `v1:` + base64(iv|tag|ciphertext).
 */
export function encryptSettingsSecret(plain: string): string {
  if (!isSettingsEncryptionConfigured()) {
    throw ValidationError("SETTINGS_ENCRYPTION_KEY is not configured");
  }
  const key = deriveKey(env.SETTINGS_ENCRYPTION_KEY!);
  const iv = randomBytes(IV_LEN);
  const cipher = createCipheriv(ALGO, key, iv);
  const enc = Buffer.concat([cipher.update(plain, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();
  const packed = Buffer.concat([iv, tag, enc]);
  return `v1:${packed.toString("base64")}`;
}

/**
 * Decrypts a string produced by `encryptSettingsSecret`.
 */
export function decryptSettingsSecret(payload: string): string {
  if (!payload.startsWith("v1:")) {
    throw ValidationError("Invalid encrypted payload format");
  }
  if (!isSettingsEncryptionConfigured()) {
    throw ValidationError("SETTINGS_ENCRYPTION_KEY is not configured");
  }
  const raw = Buffer.from(payload.slice(3), "base64");
  if (raw.length < IV_LEN + AUTH_TAG_LEN + 1) {
    throw ValidationError("Corrupted encrypted payload");
  }
  const iv = raw.subarray(0, IV_LEN);
  const tag = raw.subarray(IV_LEN, IV_LEN + AUTH_TAG_LEN);
  const data = raw.subarray(IV_LEN + AUTH_TAG_LEN);
  const key = deriveKey(env.SETTINGS_ENCRYPTION_KEY!);
  const decipher = createDecipheriv(ALGO, key, iv);
  decipher.setAuthTag(tag);
  return Buffer.concat([decipher.update(data), decipher.final()]).toString("utf8");
}
