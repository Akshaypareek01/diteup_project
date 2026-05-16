/**
 * Site settings CRUD with optional encryption for secret keys (PRD §8.10).
 */
import type { Prisma } from "@prisma/client";
import type { Request } from "express";

import { recordAudit } from "../utils/adminAudit.js";
import { NotFound, ValidationError } from "../utils/errors.js";
import {
  decryptSettingsSecret,
  encryptSettingsSecret,
  isSettingsEncryptionConfigured,
} from "../utils/settingsCrypto.js";
import { prisma } from "../utils/prisma.js";

/**
 * Returns true when values for this key should be stored encrypted at rest.
 */
export function isSecretSettingKey(key: string): boolean {
  return /(_SECRET|_PASSWORD|_TOKEN|API_KEY|ApiKey)$/i.test(key) || /secret|password|apikey|webhook/i.test(key);
}

function redactForList(key: string, value: unknown): unknown {
  if (isSecretSettingKey(key)) return "[encrypted]";
  return value;
}

/**
 * Lists all settings with secrets redacted in list view.
 */
export async function listSettingsAdmin() {
  const rows = await prisma.setting.findMany({ orderBy: { key: "asc" } });
  return rows.map((r) => ({
    key: r.key,
    value: redactForList(r.key, r.value),
    updatedAt: r.updatedAt,
  }));
}

/**
 * Fetches one setting — decrypts when stored with v1: envelope.
 */
export async function getSettingAdmin(key: string) {
  const row = await prisma.setting.findUnique({ where: { key } });
  if (!row) throw NotFound("Setting not found");

  let value: unknown = row.value;
  if (typeof value === "string" && value.startsWith("v1:")) {
    if (!isSettingsEncryptionConfigured()) {
      throw ValidationError("Cannot decrypt setting — SETTINGS_ENCRYPTION_KEY not set");
    }
    const plain = decryptSettingsSecret(value);
    try {
      value = JSON.parse(plain) as unknown;
    } catch {
      value = plain;
    }
  }

  return { key: row.key, value, updatedAt: row.updatedAt };
}

/**
 * Upserts a JSON setting value.
 */
export async function upsertSettingAdmin(input: {
  key: string;
  value: unknown;
  actorId: string;
  req?: Request;
}): Promise<void> {
  const key = input.key.trim();
  if (!key) throw ValidationError("key required");

  let stored: Prisma.InputJsonValue;

  if (isSecretSettingKey(key)) {
    if (!isSettingsEncryptionConfigured()) {
      throw ValidationError(
        "SETTINGS_ENCRYPTION_KEY (≥16 chars) required to store secret settings",
      );
    }
    const plain = typeof input.value === "string" ? input.value : JSON.stringify(input.value);
    const enc = encryptSettingsSecret(plain);
    stored = enc as unknown as Prisma.InputJsonValue;
  } else {
    stored = input.value as Prisma.InputJsonValue;
  }

  await prisma.setting.upsert({
    where: { key },
    create: { key, value: stored },
    update: { value: stored },
  });

  await recordAudit({
    actorId: input.actorId,
    action: "setting.upsert",
    entity: "Setting",
    entityId: key,
    diff: { secret: isSecretSettingKey(key) },
    req: input.req,
  });
}
