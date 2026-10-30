import type { MetadataRoute } from "next";

import { siteUrl } from "@/config/app";
import { OFFERINGS } from "@/lib/products";

// Public pages only. Product pages come from the fixed catalogue, so the sitemap needs no database call.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = siteUrl();
  const pages = ["", "/products", "/solutions", "/security", "/insights", "/connect", "/hackathon/register"];
  return [...pages, ...OFFERINGS.map((o) => `/products/${o.value}`)].map((path) => ({ url: `${base}${path}` }));
}
