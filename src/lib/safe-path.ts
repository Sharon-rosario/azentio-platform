/**
 * A same-origin path that is safe to redirect or link to, or null.
 * `//evil.example` and `/\evil.example` start with "/" but browsers treat them as protocol-relative URLs to
 * another host, so a plain `startsWith("/")` check is an open redirect. Control characters are refused too.
 */
export function safePath(value: unknown): string | null {
  if (typeof value !== "string" || value.length > 2048) return null;
  if (!value.startsWith("/") || value.startsWith("//") || value.startsWith("/\\")) return null;
  if (/[\u0000-\u001f\u007f]/.test(value)) return null;
  return value;
}
