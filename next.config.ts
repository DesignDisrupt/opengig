import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  // Private to the band: tell search engines not to index anything, on every
  // response (pages, files, the lot). See also src/app/robots.ts.
  async headers() {
    return [{ source: "/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] }];
  },
  partialPrefetching: true,
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
