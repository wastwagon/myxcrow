/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  env: {
    NEXT_PUBLIC_API_BASE_URL: process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:4000/api',
  },
  images: {
    domains: ['localhost'],
  },
  // Allow running in Docker
  output: 'standalone',
}

module.exports = nextConfig

