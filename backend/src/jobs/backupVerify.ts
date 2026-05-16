/**
 * Provider backup verification hook (PRD §10.8) — optional HTTP ping + audit log line.
 */
import { env } from "../config/env.js";
import { logger } from "../utils/logger.js";
import { prisma } from "../utils/prisma.js";

const SETTING_KEY = "jobRuns:backupVerify";

type BackupState = {
  lastRunAt: string;
  lastStatus?: number;
};

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

/**
 * Weekly reminder to verify backups; pings `BACKUP_VERIFY_URL` when set.
 */
export async function runBackupVerifyIfDue(): Promise<void> {
  const now = new Date();
  const row = await prisma.setting.findUnique({ where: { key: SETTING_KEY } });
  const state = (row?.value as BackupState | null) ?? null;
  if (state?.lastRunAt) {
    const last = new Date(state.lastRunAt);
    if (now.getTime() - last.getTime() < WEEK_MS) {
      return;
    }
  }

  let lastStatus: number | undefined;
  if (env.BACKUP_VERIFY_URL) {
    try {
      const ctrl = new AbortController();
      const t = setTimeout(() => ctrl.abort(), 12_000);
      const res = await fetch(env.BACKUP_VERIFY_URL, { signal: ctrl.signal });
      clearTimeout(t);
      lastStatus = res.status;
      logger.info({ status: res.status, url: env.BACKUP_VERIFY_URL }, "backup verify ping");
    } catch (err) {
      logger.error({ err }, "backup verify ping failed");
    }
  } else {
    logger.info("BACKUP_VERIFY_URL unset — confirm DB backups on your host/provider console");
  }

  await prisma.setting.upsert({
    where: { key: SETTING_KEY },
    create: {
      key: SETTING_KEY,
      value: { lastRunAt: now.toISOString(), lastStatus } as object,
    },
    update: {
      value: { lastRunAt: now.toISOString(), lastStatus } as object,
    },
  });
}
