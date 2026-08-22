/** @type {import('next').NextConfig} */
const isProd = process.env.NODE_ENV === 'production';

function getApiProxyOrigin() {
  const explicit = (process.env.API_PROXY_ORIGIN || '').trim().replace(/\/$/, '');
  if (explicit) return explicit;
  const pub = (process.env.NEXT_PUBLIC_API_BASE_URL || '').trim();
  if (/^https?:\/\//i.test(pub)) {
    try {
      return new URL(pub).origin;
    } catch {
      /* ignore */
    }
  }
  return 'http://localhost:4000';
}

const apiOrigin = getApiProxyOrigin();

const connectSrc = [
  "'self'",
  apiOrigin,
  !isProd && 'http://localhost:4000',
  'https://via.intercom.io',
  'https://api.intercom.io',
  'https://api-iam.intercom.io',
  'https://api.au.intercom.io',
  'https://api.eu.intercom.io',
  'https://nexus-websocket-a.intercom.io',
  'https://nexus-websocket-b.intercom.io',
  'wss://nexus-websocket-a.intercom.io',
  'wss://nexus-websocket-b.intercom.io',
]
  .filter(Boolean)
  .join(' ');

const csp = [
  "default-src 'self'",
  "base-uri 'self'",
  "object-src 'none'",
  "frame-ancestors 'none'",
  `script-src 'self' 'unsafe-inline' 'unsafe-eval' https://widget.intercom.io https://js.intercomcdn.com`,
  "style-src 'self' 'unsafe-inline'",
  "img-src 'self' data: blob: https:",
  "font-src 'self' data: https://js.intercomcdn.com https://fonts.intercomcdn.com",
  `connect-src ${connectSrc}`,
  "frame-src 'self' about:blank blob: https://*.intercom.io https://*.intercomcdn.com https://intercom-sheets.com https://www.intercom.com https://intercom.help https://widget.intercom.io https://js.intercomcdn.com",
  "media-src 'self' https://js.intercomcdn.com",
  "form-action 'self'",
].join('; ');

const securityHeaders = [
  { key: 'Content-Security-Policy', value: csp },
  { key: 'X-Frame-Options', value: 'DENY' },
  { key: 'X-Content-Type-Options', value: 'nosniff' },
  { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
  { key: 'Permissions-Policy', value: 'camera=(self), microphone=(), geolocation=()' },
  { key: 'X-DNS-Prefetch-Control', value: 'off' },
];

if (isProd) {
  securityHeaders.push({
    key: 'Strict-Transport-Security',
    value: 'max-age=63072000; includeSubDomains; preload',
  });
  securityHeaders[0] = {
    key: 'Content-Security-Policy',
    value: `${csp}; upgrade-insecure-requests`,
  };
}

const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['@myxcrow/shared'],
  // Production builds should not fail due to ESLint configuration/rules.
  // Keep linting in CI or locally via `pnpm lint`.
  eslint: {
    ignoreDuringBuilds: true,
  },
  compress: true,
  poweredByHeader: false,
  generateEtags: true,
  async redirects() {
    if (!isProd) return [];
    return [
      { source: '/mockup', destination: '/404', permanent: false },
      { source: '/mockup/:path*', destination: '/404', permanent: false },
      { source: '/play-store-icon.html', destination: '/404', permanent: false },
      { source: '/play-store-feature-graphic.html', destination: '/404', permanent: false },
    ];
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${apiOrigin}/api/:path*`,
      },
    ];
  },
  async headers() {
    return [
      {
        source: '/:path*',
        headers: securityHeaders,
      },
    ];
  },
  // Serve static /public images directly. The /_next/image optimizer often 502s on
  // Render (self-fetch / sharp), which blanked V2 heroes and cards.
  images: {
    unoptimized: true,
    domains: ['localhost', 'api.myxcrow.com', 'myxcrow.com'],
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
