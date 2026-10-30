// Is a quote really in the source? Word-level match ignoring case and punctuation, exact first, then the closest run
// of words. A model's claim that "the evidence says X" is only kept when X is found. (TS port of engines/evidence.py.)

const MIN_WORDS = 3;
const THRESHOLD = 0.85;

const words = (s: string) => s.toLowerCase().match(/[\p{L}\p{N}]+/gu) ?? [];

function ratio(a: string, b: string): number {
  // Levenshtein similarity, fine for sentence-length strings.
  const m = a.length, n = b.length;
  if (!m || !n) return 0;
  let prev = Array.from({ length: n + 1 }, (_, j) => j);
  for (let i = 1; i <= m; i++) {
    const cur = [i];
    for (let j = 1; j <= n; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    prev = cur;
  }
  return 1 - prev[n] / Math.max(m, n);
}

export function locate(quote: string, text: string): number {
  const q = words(quote);
  const doc = words(text);
  if (q.length < MIN_WORDS || !doc.length) return 0;
  const target = q.join(" ");
  if (doc.join(" ").includes(target)) return 1;
  let best = 0;
  const slack = Math.max(1, Math.floor(q.length / 5));
  for (let size = Math.max(1, q.length - slack); size <= q.length + slack; size++) {
    for (let i = 0; i + size <= doc.length; i++) best = Math.max(best, ratio(doc.slice(i, i + size).join(" "), target));
  }
  return best >= THRESHOLD ? best : 0;
}
