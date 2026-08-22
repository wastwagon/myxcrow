/** Browser API origin. Production builds must set NEXT_PUBLIC_API_BASE_URL for SSR. */

function stripTrailingSlash(value: string): string {
  return value.replace(/\/$/, '');
}

function absoluteFromEnv(): string | null {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (raw && /^https?:\/\//i.test(raw)) return stripTrailingSlash(raw);
  const proxy = process.env.API_PROXY_ORIGIN?.trim();
  if (proxy && /^https?:\/\//i.test(proxy)) return `${stripTrailingSlash(proxy)}/api`;
  return null;
}

/**
 * In the browser, call `/api` on the same host so auth cookies are first-party.
 * The Next server rewrites that path to the real API (see next.config.js).
 */
export function getApiBaseUrl(): string {
  if (typeof window !== 'undefined') {
    return '/api';
  }
  const absolute = absoluteFromEnv();
  if (absolute) return absolute;
  if (process.env.NODE_ENV !== 'production') {
    return 'http://localhost:4000/api';
  }
  throw new Error('NEXT_PUBLIC_API_BASE_URL is required in production');
}
