import type { MetadataRoute } from 'next';

/**
 * Keeps crawlers away from the API and the (already unguessable) vault path.
 * This is politeness, not security — the vault is protected by authentication.
 */
export default function robots(): MetadataRoute.Robots {
  const slug = (process.env.ADMIN_SLUG ?? '').trim();
  const disallow = ['/api/'];
  if (slug) disallow.push(`/vault-${slug}`);

  return {
    rules: [{ userAgent: '*', allow: '/', disallow }],
    sitemap: undefined,
  };
}
