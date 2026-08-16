/** Allowed browser origins for CORS and cookie CSRF checks. */

function stripSlash(value: string): string {
  return value.replace(/\/$/, '');
}

function expandWwwPair(origin: string): string[] {
  try {
    const url = new URL(origin);
    const host = url.hostname;
    const altHost = host.startsWith('www.') ? host.slice(4) : `www.${host}`;
    if (!host.includes('.') || host === 'localhost') return [stripSlash(origin)];
    const a = `${url.protocol}//${host}${url.port ? `:${url.port}` : ''}`;
    const b = `${url.protocol}//${altHost}${url.port ? `:${url.port}` : ''}`;
    return [stripSlash(a), stripSlash(b)];
  } catch {
    return [stripSlash(origin)];
  }
}

export function getAllowedOrigins(): string[] {
  const raw = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
    : [process.env.WEB_APP_URL || process.env.WEB_BASE_URL || 'http://localhost:3000'];
  return [...new Set(raw.flatMap(expandWwwPair))];
}

export function isAllowedOrigin(origin: string): boolean {
  const candidate = stripSlash(origin);
  return getAllowedOrigins().includes(candidate);
}
