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

function expandSchemePair(origin: string): string[] {
  try {
    const url = new URL(origin);
    if (url.protocol !== 'http:' && url.protocol !== 'https:') return [stripSlash(origin)];
    const host = url.host;
    return [`http://${host}`, `https://${host}`].map(stripSlash);
  } catch {
    return [stripSlash(origin)];
  }
}

export function getAllowedOrigins(): string[] {
  const raw = process.env.CORS_ORIGINS
    ? process.env.CORS_ORIGINS.split(',').map((o) => o.trim()).filter(Boolean)
    : [process.env.WEB_APP_URL || process.env.WEB_BASE_URL || 'http://localhost:3007'];
  const origins = [...new Set(raw.flatMap(expandWwwPair).flatMap(expandSchemePair))];
  if (process.env.NODE_ENV !== 'production') {
    for (const extra of [
      'http://localhost:3007',
      'http://localhost:3000',
      'http://localhost:3017',
      'http://127.0.0.1:3007',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:3017',
    ]) {
      if (!origins.includes(extra)) origins.push(extra);
    }
  }
  return origins;
}

export function isAllowedOrigin(origin: string): boolean {
  const candidate = stripSlash(origin);
  return getAllowedOrigins().includes(candidate);
}
