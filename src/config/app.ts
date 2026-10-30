export const appConfig = {
  name: "azentio.ai",
  tagline: "Build intelligence. Create shared value.",
  /** Every date in the UI is shown in this zone (server and browser render the same text). */
  timeZone: "Asia/Kolkata",
};

/**
 * The public origin, for absolute URLs in link previews. NEXT_PUBLIC_SITE_URL wins;
 * on Vercel the production domain is used; locally, localhost.
 */
export function siteUrl(): string {
  if (process.env.NEXT_PUBLIC_SITE_URL) return process.env.NEXT_PUBLIC_SITE_URL.replace(/\/$/, "");
  if (process.env.VERCEL_PROJECT_PRODUCTION_URL) return `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`;
  return "http://localhost:3000";
}
