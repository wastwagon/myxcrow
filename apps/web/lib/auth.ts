export interface User {
  id: string;
  email?: string;
  phone?: string;
  firstName?: string;
  lastName?: string;
  roles: string[];
  kycStatus: string;
  impersonatedBy?: string;
}

export interface AuthResponse {
  user: User;
  accessToken?: string;
  refreshToken?: string;
}

const USER_KEY = 'user';
const COOKIE_AUTH_MIGRATED_KEY = 'mx_cookie_auth_migrated';

/** Drop pre-cookie JWTs so they cannot be reused after this deploy. */
export function migrateLegacyTokens(): void {
  if (typeof window === 'undefined') return;
  const alreadyMigrated = localStorage.getItem(COOKIE_AUTH_MIGRATED_KEY) === '1';
  const hadLegacy =
    !!localStorage.getItem('accessToken') ||
    !!localStorage.getItem('refreshToken') ||
    !!localStorage.getItem('token');
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('token');
  if (!alreadyMigrated && hadLegacy) {
    localStorage.removeItem(USER_KEY);
  }
  localStorage.setItem(COOKIE_AUTH_MIGRATED_KEY, '1');
}

export function getAccessToken(): string | null {
  return null;
}

export function setAuthTokens(_accessToken?: string, _refreshToken?: string): void {
  /* Tokens are httpOnly cookies set by the API. */
}

export function clearAuth(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(USER_KEY);
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('token');
}

export function getUser(): User | null {
  if (typeof window === 'undefined') return null;
  const userStr = localStorage.getItem(USER_KEY);
  if (!userStr) return null;
  try {
    return JSON.parse(userStr);
  } catch {
    return null;
  }
}

export function setUser(user: User): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function isAuthenticated(): boolean {
  return !!getUser();
}

export function isAdmin(): boolean {
  const user = getUser();
  return user?.roles?.includes('ADMIN') ?? false;
}

export function isImpersonating(): boolean {
  return !!getUser()?.impersonatedBy;
}

export async function logout(): Promise<void> {
  if (typeof window !== 'undefined') {
    try {
      const { disconnectChatSocket } = await import('./chat-socket');
      disconnectChatSocket();
    } catch {
      /* ignore */
    }
    try {
      const { getApiBaseUrl } = await import('./api-base');
      await fetch(`${getApiBaseUrl()}/auth/logout`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
      });
    } catch {
      /* still clear local state */
    }
  }
  clearAuth();
}
