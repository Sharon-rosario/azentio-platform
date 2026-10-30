import type { MetadataRoute } from "next";

// No crawling at all: this is a hackathon prototype that uses Azentio's real name and logo, so it must not appear in
// search results next to azentio.com. Every page also carries a noindex meta tag (app/layout.tsx).
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", disallow: "/" } };
}
