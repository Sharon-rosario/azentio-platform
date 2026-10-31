// AIRA's "remove identifiers": the model rewrites the copy without the identifiers it found; the rewrite is only used
// after the checks below. If it fails them, the found words are replaced in the original instead.

export type Redaction = { text: string; replacement: string };

const escape = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * The model's suggested wording, or the fallback when the suggestion is empty, long, or would itself identify someone:
 * it contains one of the identifiers being removed, or the pattern scanner flags it.
 */
export function safeReplacement(suggested: string, fallback: string, found: string[], flagged: (s: string) => boolean): string {
  const s = suggested.trim();
  const lower = s.toLowerCase();
  if (!s || s.length > 60 || flagged(s) || found.some((f) => f.trim() && lower.includes(f.trim().toLowerCase()))) return fallback;
  return s;
}

/** Every occurrence, in any case, of each identifier replaced by its wording; longest first, so an email address goes
 * before the organisation name inside it. Wording that starts a sentence is capitalised. */
export function applyRedactions(text: string, changes: Redaction[]): string {
  return [...changes]
    .filter((c) => c.text.trim())
    .sort((a, b) => b.text.length - a.text.length)
    .reduce((t, c) => t.replace(new RegExp(escape(c.text), "gi"), (_m, at: number, all: string) => {
      const before = all.slice(0, at).trimEnd();
      return before === "" || /[.!?]$/.test(before) ? c.replacement.charAt(0).toUpperCase() + c.replacement.slice(1) : c.replacement;
    }), text);
}

/**
 * AIRA's rewritten copy, accepted only when it is safe to put in front of the moderator: both fields present and within
 * limits, none of the identifiers it found still in it (in any case), and nothing the pattern scanner flags. Otherwise
 * null, and the caller falls back to replacing the found words.
 */
export function safeRewrite(rewrite: { title: string; body: string } | undefined, found: string[], flagged: (s: string) => boolean,
  max = { title: 140, body: 4000 }): { title: string; body: string } | null {
  if (!rewrite) return null;
  const title = rewrite.title.trim();
  const body = rewrite.body.trim();
  if (!title || !body || title.length > max.title || body.length > max.body) return null;
  const lower = `${title}\n${body}`.toLowerCase();
  if (found.some((f) => f.trim() && lower.includes(f.trim().toLowerCase())) || flagged(title) || flagged(body)) return null;
  return { title, body };
}
