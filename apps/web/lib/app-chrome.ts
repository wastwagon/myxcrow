export const APP_CHROME_DARK = '#1f1414';
export const APP_CHROME_LIGHT = '#ffffff';

const LIGHT_CHROME_PATHS = new Set([
  '/login',
  '/register',
  '/forgot-password',
  '/reset-password',
]);

export function isLightChromePath(pathname: string): boolean {
  return LIGHT_CHROME_PATHS.has(pathname);
}

declare global {
  interface Window {
    __myxcrowApplyChrome?: (path: string) => void;
  }
}

/** Keep the status-bar cover in sync on client-side navigations. */
export function applyAppChrome(pathname: string): void {
  if (typeof window === 'undefined') return;
  if (typeof window.__myxcrowApplyChrome === 'function') {
    window.__myxcrowApplyChrome(pathname);
    return;
  }
  const hex = isLightChromePath(pathname) ? APP_CHROME_LIGHT : APP_CHROME_DARK;
  document.documentElement.style.setProperty('--app-chrome-bg', hex);
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', hex);
}
