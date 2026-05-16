/**
 * Server-side profanity gate for review body/title/display name (PRD §6.7.2, §6.7.6).
 * Small v1 wordlist; extend or swap for a proper filter service pre-launch.
 */

const BLOCKED = new Set(
  [
    "fuck",
    "shit",
    "bitch",
    "bastard",
    "cunt",
    "nazi",
    "kill yourself",
    "kys",
  ].map((w) => w.toLowerCase()),
);

/**
 * Returns true if `text` contains a blocked substring (word-boundary-ish for short tokens).
 */
export function containsProfanity(text: string): boolean {
  const lower = text.toLowerCase();
  for (const word of BLOCKED) {
    if (word.includes(" ")) {
      if (lower.includes(word)) return true;
    } else if (
      new RegExp(`\\b${word.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`).test(lower)
    ) {
      return true;
    }
  }
  return false;
}
