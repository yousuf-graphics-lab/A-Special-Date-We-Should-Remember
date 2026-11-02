import type { MetadataRoute } from 'next';

/** A private little world: keep it out of every search engine. */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [{ userAgent: '*', disallow: '/' }],
  };
}
