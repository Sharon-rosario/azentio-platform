import type { MetadataRoute } from "next";

// Public pages stay crawlable on purpose. Link-preview bots (LinkedIn, X, Slack, WhatsApp) obey robots.txt, so a blanket
// disallow would leave shared links without a preview card. It would also hide the noindex tag from search engines,
// which then can't see that they must not index the page. Search results are kept out by the noindex meta tag on every
// page (app/layout.tsx); signed-in and machine surfaces are still disallowed.
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/", disallow: ["/portal", "/api", "/login", "/invite"] } };
}
