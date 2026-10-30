// Flags text that looks like it identifies a customer or carries restricted data. A warning, not a guarantee: the
// moderator still reads every proposed shared copy.

const DETECTORS: [string, RegExp][] = [
  ["email address", /[\w.+-]+@[\w-]+\.[\w.-]+/g],
  ["phone number", /(?:\+\d{1,3}[\s-]?)?\b\d{3,5}[\s-]?\d{3,4}[\s-]?\d{3,4}\b/g],
  ["account or card number", /\b\d{9,19}\b/g],
  ["PAN (India tax id)", /\b[A-Z]{5}\d{4}[A-Z]\b/g],
  ["IBAN", /\b[A-Z]{2}\d{2}[A-Z0-9]{11,30}\b/g],
];

export type Flag = { kind: string; match: string };

export function scan(...texts: string[]): Flag[] {
  const flags: Flag[] = [];
  for (const t of texts) {
    for (const [kind, re] of DETECTORS) {
      for (const m of t.matchAll(re)) flags.push({ kind, match: m[0] });
    }
  }
  // An account number also matches the phone pattern; keep the most specific label per match.
  const seen = new Map<string, Flag>();
  for (const f of flags) if (!seen.has(f.match) || f.kind !== "phone number") seen.set(f.match, f);
  return [...seen.values()];
}
