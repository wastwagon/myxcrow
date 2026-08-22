import type { CookieOptions, Request, Response } from 'express';

export const ACCESS_COOKIE = 'mx_at';
export const REFRESH_COOKIE = 'mx_rt';
export const ADMIN_ACCESS_COOKIE = 'mx_admin_at';
export const ADMIN_REFRESH_COOKIE = 'mx_admin_rt';

const ACCESS_MAX_AGE_MS = 15 * 60 * 1000;
const REFRESH_MAX_AGE_MS = 30 * 24 * 60 * 60 * 1000;
const IMPERSONATE_MAX_AGE_MS = 60 * 60 * 1000;

export function parseCookieHeader(cookieHeader?: string): Record<string, string> {
  const out: Record<string, string> = {};
  if (!cookieHeader) return out;
  for (const part of cookieHeader.split(';')) {
    const idx = part.indexOf('=');
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    if (!key) continue;
    try {
      out[key] = decodeURIComponent(part.slice(idx + 1).trim());
    } catch {
      out[key] = part.slice(idx + 1).trim();
    }
  }
  return out;
}

function siteKey(host: string): string {
  const multiPart = ['onrender.com', 'herokuapp.com', 'github.io', 'vercel.app', 'netlify.app'];
  for (const t of multiPart) {
    if (host === t || host.endsWith(`.${t}`)) return host;
  }
  if (host === 'localhost' || host.endsWith('.localhost')) return 'localhost';
  const parts = host.split('.');
  if (parts.length <= 2) return host;
  return parts.slice(-2).join('.');
}

function resolveSameSite(req?: Request): 'lax' | 'none' {
  const forced = (process.env.COOKIE_SAMESITE || '').toLowerCase();
  if (forced === 'none' || forced === 'lax') return forced;
  const web = process.env.WEB_APP_URL || process.env.WEB_BASE_URL;
  if (web && req?.hostname) {
    try {
      if (siteKey(new URL(web).hostname) === siteKey(req.hostname)) return 'lax';
    } catch {
      /* fall through */
    }
  }
  return process.env.NODE_ENV === 'production' ? 'none' : 'lax';
}

export function authCookieOptions(
  req: Request | undefined,
  maxAgeMs: number,
): CookieOptions {
  const forwarded = (req?.headers['x-forwarded-proto'] as string | undefined) || '';
  const https = forwarded.split(',')[0]?.trim() === 'https' || req?.protocol === 'https';
  const sameSite = resolveSameSite(req);
  const secure = sameSite === 'none' ? true : process.env.NODE_ENV === 'production' || https;
  const opts: CookieOptions & { partitioned?: boolean } = {
    httpOnly: true,
    secure,
    sameSite,
    path: '/',
    maxAge: maxAgeMs,
  };
  // CHIPS: Chrome still sends these when the API host is third-party to the web app.
  if (sameSite === 'none') {
    opts.partitioned = true;
  }
  return opts;
}

export function setAuthCookies(
  req: Request,
  res: Response,
  tokens: { accessToken: string; refreshToken: string },
  opts?: { impersonating?: boolean },
) {
  const accessAge = opts?.impersonating ? IMPERSONATE_MAX_AGE_MS : ACCESS_MAX_AGE_MS;
  const refreshAge = opts?.impersonating ? IMPERSONATE_MAX_AGE_MS : REFRESH_MAX_AGE_MS;
  res.cookie(ACCESS_COOKIE, tokens.accessToken, authCookieOptions(req, accessAge));
  res.cookie(REFRESH_COOKIE, tokens.refreshToken, authCookieOptions(req, refreshAge));
}

export function stashAdminCookies(req: Request, res: Response) {
  const cookies = parseCookieHeader(req.headers.cookie);
  const access = cookies[ACCESS_COOKIE];
  const refresh = cookies[REFRESH_COOKIE];
  if (access) {
    res.cookie(ADMIN_ACCESS_COOKIE, access, authCookieOptions(req, REFRESH_MAX_AGE_MS));
  }
  if (refresh) {
    res.cookie(ADMIN_REFRESH_COOKIE, refresh, authCookieOptions(req, REFRESH_MAX_AGE_MS));
  }
}

export function clearAuthCookies(res: Response) {
  const variants: CookieOptions[] = [
    { httpOnly: true, path: '/' },
    { httpOnly: true, path: '/', secure: true, sameSite: 'none' },
    { httpOnly: true, path: '/', secure: true, sameSite: 'none', partitioned: true } as CookieOptions,
    { httpOnly: true, path: '/', sameSite: 'lax' },
  ];
  for (const name of [ACCESS_COOKIE, REFRESH_COOKIE]) {
    for (const opts of variants) res.clearCookie(name, opts);
  }
}

export function clearAdminCookies(res: Response) {
  const variants: CookieOptions[] = [
    { httpOnly: true, path: '/' },
    { httpOnly: true, path: '/', secure: true, sameSite: 'none' },
    { httpOnly: true, path: '/', secure: true, sameSite: 'none', partitioned: true } as CookieOptions,
    { httpOnly: true, path: '/', sameSite: 'lax' },
  ];
  for (const name of [ADMIN_ACCESS_COOKIE, ADMIN_REFRESH_COOKIE]) {
    for (const opts of variants) res.clearCookie(name, opts);
  }
}

export function clearAllAuthCookies(res: Response) {
  clearAuthCookies(res);
  clearAdminCookies(res);
}
