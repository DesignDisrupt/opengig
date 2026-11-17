import type { MetadataRoute } from "next";

/**
 * OpenGig is private to the band: keep every crawler out. The noindex meta
 * tag (layout.tsx) and X-Robots-Tag header (next.config.ts) back this up for
 * anything that ignores robots.txt or finds a link elsewhere.
 */
export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", disallow: "/" } };
}
