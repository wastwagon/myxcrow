/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Production builds should not fail due to ESLint configuration/rules.
  // Keep linting in CI or locally via `pnpm lint`.
  eslint: {
    ignoreDuringBuilds: true,
  },
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api',
  },
  // Production optimizations (standalone disabled - causes styled-jsx MODULE_NOT_FOUND in pnpm monorepo on Render)
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  // Image optimization
  images: {
    domains: ['localhost', 'api.myxcrow.com', 'myxcrow.com'],
    formats: ['image/avif', 'image/webp'],
    minimumCacheTTL: 60,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.myxcrow.com',
      },
      {
        protocol: 'https',
        hostname: 'myxcrow.com',
      },
      {
        protocol: 'https',
        hostname: '**.amazonaws.com', // For S3 images
      },
    ],
  },
}

module.exports = nextConfig

