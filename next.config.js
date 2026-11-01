/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  experimental: {
    // fontsource variable fonts are only referenced from CSS in `layout.tsx`
    optimizePackageImports: ['lucide-react'],
  },
  async headers() {
    const headers = [
      { key: 'X-Content-Type-Options', value: 'nosniff' },
      { key: 'X-Frame-Options', value: 'DENY' },
      { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
      { key: 'X-DNS-Prefetch-Control', value: 'off' },
      {
        key: 'Permissions-Policy',
        value: 'camera=(), microphone=(), geolocation=(), payment=()',
      },
    ];

    // Only lock the site down to a single origin when explicitly configured.
    // Without this, WhatsApp / WhatsApp Web in-app previews would be blocked.
    if (process.env.ALLOWED_EMBED_ORIGIN) {
      headers.push({
        key: 'Content-Security-Policy',
        value: `frame-ancestors 'self' ${process.env.ALLOWED_EMBED_ORIGIN}`,
      });
    } else {
      headers.push({ key: 'Content-Security-Policy', value: "frame-ancestors 'self'" });
    }

    return [{ source: '/:path*', headers }];
  },
};

module.exports = nextConfig;
