import type { NextConfig } from "next";

// GitHub Pages serves project sites from a repository subpath (e.g. /flexnotes/).
// CI sets NEXT_PUBLIC_BASE_PATH; local development runs at the root with no base path.
const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "";

const nextConfig: NextConfig = {
  output: "export",
  ...(basePath ? { basePath, assetPrefix: basePath } : {}),
  images: { unoptimized: true },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
