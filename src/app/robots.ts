import type { MetadataRoute } from "next";

import { siteUrl } from "@/config/app";

// Public pages may be indexed; signed-in and machine surfaces may not.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/portal", "/api", "/login", "/invite"] },
    sitemap: `${siteUrl()}/sitemap.xml`,
  };
}
