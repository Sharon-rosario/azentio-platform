import type { NextConfig } from "next";

// Defence in depth on every response. Pages get a nonce-based Content Security Policy from src/proxy.ts; everything
// else (API responses, generated images, static files) gets this static one, which allows nothing to run or frame.
const STATIC_CSP = "default-src 'none'; img-src 'self'; style-src 'unsafe-inline'; frame-ancestors 'none'; base-uri 'none'; form-action 'none'";

const securityHeaders = [
  { key: "Strict-Transport-Security", value: "max-age=63072000; includeSubDomains; preload" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=(), payment=()" },
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  // PGlite loads its WASM and data files relative to its own module; bundling breaks those paths.
  serverExternalPackages: ["@electric-sql/pglite"],
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Pages are excluded here: src/proxy.ts sets their policy, with a per-request nonce.
      { source: "/(api|_next/static|_next/image|icon.svg|apple-icon|opengraph-image|robots.txt|sitemap.xml)/:path*", headers: [{ key: "Content-Security-Policy", value: STATIC_CSP }] },
      { source: "/(icon.svg|apple-icon|opengraph-image|robots.txt|sitemap.xml)", headers: [{ key: "Content-Security-Policy", value: STATIC_CSP }] },
      // API responses carry personal data: never cached by browsers or proxies.
      { source: "/api/:path*", headers: [{ key: "Cache-Control", value: "no-store" }] },
    ];
  },
  // No floating "N" button in dev. Compile and runtime errors still show.
  devIndicators: false,
  turbopack: {
    root: __dirname,
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
