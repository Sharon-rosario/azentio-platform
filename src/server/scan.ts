// Flags text that looks like it identifies a customer or carries restricted data. A warning, not a guarantee: the
// moderator still reads every proposed shared copy, and publication is blocked while anything here still matches.

const DETECTORS: [string, RegExp][] = [
  ["email address", /[\w.+-]+@[\w-]+\.[\w.-]+/g],
  // Digit groups separated by spaces or dashes, in any grouping ("98765 43210", "+91-22-4012-3456"). Kept only when
  // the total is phone-length (PHONE_DIGITS), so years, percentages and amounts aren't flagged.
  ["phone number", /(?:\+\d{1,3}[\s-]?)?\b\d{2,5}(?:[\s-]\d{2,5}){1,4}\b/g],
  ["account or card number", /\b\d{9,19}\b/g],
  // Account and card numbers written in groups of four ("4455 6677 8899", "4111-1111-1111-1111").
  ["account or card number", /\b\d{4}(?:[\s-]\d{4}){2,4}\b/g],
  ["PAN (India tax id)", /\b[A-Z]{5}\d{4}[A-Z]\b/g],
  ["IBAN", /\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b/g],
];

const PHONE_DIGITS = [10, 13];

export type Flag = { kind: string; match: string };

export function scan(...texts: string[]): Flag[] {
  const flags: Flag[] = [];
  for (const t of texts) {
    for (const [kind, re] of DETECTORS) {
      for (const m of t.matchAll(re)) {
        const digits = m[0].replace(/\D/g, "").length;
        if (kind === "phone number" && (digits < PHONE_DIGITS[0] || digits > PHONE_DIGITS[1])) continue;
        flags.push({ kind, match: m[0].trim() });
      }
    }
  }
  // An unbroken account number can also look like a phone number; keep the most specific label per match.
  const seen = new Map<string, Flag>();
  for (const f of flags) if (!seen.has(f.match) || f.kind !== "phone number") seen.set(f.match, f);
  return [...seen.values()];
}
