/* eslint-disable @typescript-eslint/no-var-requires */
/** @type {import('next').NextConfig} */

const createNextIntlPlugin = require('next-intl/plugin');

const withNextIntl = createNextIntlPlugin('./src/i18n/config.ts');

const nextConfig = {
  // Optimisations de performance
  experimental: {
    optimizePackageImports: ['lucide-react', 'gsap'],
  },

  // Configuration de build
  staticPageGenerationTimeout: 20000,
  output: 'standalone',
  compress: true,

  // Optimisations d'images
  images: {
    formats: ['image/webp', 'image/avif'],
    minimumCacheTTL: 31536000, // 1 an
  },

  // Headers de sécurité et cache
  async headers() {
    return [
      {
        source: '/(.*)\\.(js|css|png|jpg|jpeg|svg|webp|avif|ico|woff|woff2)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
      {
        source: '/(.*)',
        headers: [
          {
            key: 'Permissions-Policy',
            value:
              'interest-cohort=(), camera=(), microphone=(), geolocation=()',
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff',
          },
          {
            key: 'X-Frame-Options',
            value: 'DENY',
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block',
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin',
          },
        ],
      },
    ];
  },
};

module.exports = withNextIntl(nextConfig);
