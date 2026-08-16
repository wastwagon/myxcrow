/** Browser API origin. Production builds must set NEXT_PUBLIC_API_BASE_URL. */
export function getApiBaseUrl(): string {
  const raw = process.env.NEXT_PUBLIC_API_BASE_URL?.trim();
  if (raw) return raw.replace(/\/$/, '');
  if (process.env.NODE_ENV !== 'production') {
    return 'http://localhost:4000/api';
  }
  throw new Error('NEXT_PUBLIC_API_BASE_URL is required in production');
}
