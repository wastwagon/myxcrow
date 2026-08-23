export const APP_CHROME_DARK = '#1f1414';
export const APP_CHROME_LIGHT = '#ffffff';
export const APP_CHROME_GROUPED = '#f2f2f7';
export const APP_CHROME_HOME = '#331518';

const AUTH_CHROME_PATHS = new Set([
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
]);

const CUSTOMER_PREFIXES = [
  '/dashboard',
  '/escrows',
  '/wallet',
  '/disputes',
  '/profile',
  '/help',
  '/change-password',
  '/payments',
];

export function isAuthChromePath(pathname: string): boolean {
  return AUTH_CHROME_PATHS.has(pathname);
}

/** `route` is Next's matched page (`/404`, `/500`) — `pathname` is the requested URL. */
export function isPublicLightPath(pathname: string, route?: string): boolean {
  if (route === '/404' || route === '/500') return true;
  if (isAuthChromePath(pathname)) return true;
  if (pathname === '/confirm-delivery' || pathname === '/terms' || pathname === '/privacy' || pathname === '/support') {
    return true;
  }
  if (pathname === '/404' || pathname === '/500') return true;
  return pathname.startsWith('/partner/checkout');
}

export function isAdminAppPath(pathname: string): boolean {
  return pathname.startsWith('/admin') || pathname.startsWith('/wallet/admin');
}

export function isCustomerAppPath(pathname: string): boolean {
  if (isAdminAppPath(pathname)) return false;
  return CUSTOMER_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));
}

export function isCustomerHomePath(pathname: string): boolean {
  return pathname === '/dashboard';
}

/** Maroon status-bar chrome on all customer app destinations. */
export function isCustomerMaroonChromePath(pathname: string): boolean {
  return isCustomerAppPath(pathname);
}

/** Maroon identity header + status bar on admin destinations. */
export function isMaroonChromePath(pathname: string): boolean {
  return isCustomerMaroonChromePath(pathname) || isAdminAppPath(pathname);
}

export function isCustomerAccountPath(pathname: string): boolean {
  return (
    pathname === '/profile' ||
    pathname.startsWith('/profile/') ||
    pathname === '/change-password'
  );
}

export function isCustomerDisputePath(pathname: string): boolean {
  return pathname === '/disputes' || pathname.startsWith('/disputes/');
}

export function isCustomerHelpPath(pathname: string): boolean {
  return pathname === '/help' || pathname === '/support' || pathname === '/terms' || pathname === '/privacy';
}

/** Mobile More tab: account, disputes, and help destinations. */
export function isCustomerMorePath(pathname: string): boolean {
  return (
    isCustomerAccountPath(pathname) ||
    isCustomerDisputePath(pathname) ||
    isCustomerHelpPath(pathname)
  );
}

/** @deprecated Use isAuthChromePath — kept for call-site compatibility */
export function isLightChromePath(pathname: string): boolean {
  return isAuthChromePath(pathname) || isCustomerAppPath(pathname) || isPublicLightPath(pathname) || isAdminAppPath(pathname);
}

declare global {
  interface Window {
    __myxcrowApplyChrome?: (path: string) => void;
  }
}

/** Keep the status-bar cover in sync on client-side navigations. */
export function applyAppChrome(pathname: string, route?: string): void {
  if (typeof window === 'undefined') return;
  const publicLight = isPublicLightPath(pathname, route);
  const adminLight = isAdminAppPath(pathname);
  document.documentElement.classList.toggle('customer-app', isCustomerAppPath(pathname));
  document.documentElement.classList.toggle('customer-home', isMaroonChromePath(pathname));
  document.documentElement.classList.toggle('public-light', publicLight || adminLight);
  const chromePath = publicLight && !isPublicLightPath(pathname) ? '/404' : pathname;
  if (typeof window.__myxcrowApplyChrome === 'function') {
    try {
      window.__myxcrowApplyChrome(chromePath);
    } catch {
      /* chrome helpers must not crash the Next.js tree */
    }
    return;
  }
  const hex = isMaroonChromePath(pathname)
    ? APP_CHROME_HOME
    : isCustomerAppPath(pathname) || publicLight || adminLight
      ? APP_CHROME_GROUPED
      : APP_CHROME_DARK;
  document.documentElement.style.setProperty('--app-chrome-bg', hex);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', hex);
}

export function isCustomerAppShell(): boolean {
  return typeof document !== 'undefined' && document.documentElement.classList.contains('customer-app');
}

/** Customer app, auth, legal, checkout, or error pages — not marketing or admin. */
export function isLightAppSurface(): boolean {
  if (typeof document === 'undefined') return false;
  const c = document.documentElement.classList;
  return c.contains('customer-app') || c.contains('public-light');
}

export function isGroupedLightPath(pathname: string, route?: string): boolean {
  return isCustomerAppPath(pathname) || isPublicLightPath(pathname, route) || isAdminAppPath(pathname);
}
