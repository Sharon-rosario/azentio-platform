// Is a quote really in the source? Its words must appear there in the same order, ignoring only case and punctuation.
// No fuzzy matching: one changed word ("not" -> "now") can reverse a meaning, so a near miss is a miss. A match is
// returned in the source's own words, so what gets saved is exactly what the contributor wrote.

const MIN_WORDS = 5;

/** The source's text for this quote, or null when the quote's words don't appear in it in order (or it's too short). */
export function verbatim(quote: string, text: string): string | null {
  const q = [...quote.toLowerCase().matchAll(/[\p{L}\p{N}]+/gu)].map((m) => m[0]);
  if (q.length < MIN_WORDS) return null;
  const doc = [...text.matchAll(/[\p{L}\p{N}]+/gu)];
  const lower = doc.map((m) => m[0].toLowerCase());
  for (let i = 0; i + q.length <= lower.length; i++) {
    if (q.every((w, k) => lower[i + k] === w)) {
      const first = doc[i], last = doc[i + q.length - 1];
      return text.slice(first.index, last.index! + last[0].length);
    }
  }
  return null;
}
