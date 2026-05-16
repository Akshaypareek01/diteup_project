/**
 * Broadcast merge tags per PRD §10.2 — `{{name}}`, `{{firstName}}`, `{{lastOrderDate}}`.
 */
export type BroadcastMergeContext = {
  name?: string | null;
  firstName?: string | null;
  lastOrderDate?: string | null;
};

function escapeAttr(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

/**
 * Replaces merge tags in HTML or plain fragments (case-insensitive keys).
 */
export function applyBroadcastMergeTags(html: string, ctx: BroadcastMergeContext): string {
  const first =
    (ctx.firstName?.trim() || ctx.name?.trim()?.split(/\s+/)[0] || "").trim() || "there";
  const name = (ctx.name?.trim() || first).trim() || "there";
  const lastDt = ctx.lastOrderDate?.trim() || "—";
  return html
    .replace(/\{\{name\}\}/gi, escapeAttr(name))
    .replace(/\{\{firstName\}\}/gi, escapeAttr(first))
    .replace(/\{\{lastOrderDate\}\}/gi, escapeAttr(lastDt));
}
