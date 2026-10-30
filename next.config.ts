import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
