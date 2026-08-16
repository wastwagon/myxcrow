export function isHttpsUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    return url.protocol === 'https:' && !url.username && !url.password;
  } catch {
    return false;
  }
}

export function isPaystackCheckoutUrl(raw: string): boolean {
  try {
    const url = new URL(raw);
    const host = url.hostname.toLowerCase();
    const paystack =
      host === 'paystack.com' ||
      host.endsWith('.paystack.com') ||
      host === 'paystack.co' ||
      host.endsWith('.paystack.co');
    return url.protocol === 'https:' && paystack;
  } catch {
    return false;
  }
}

/** Partner return URLs — https only. Host allowlisting is enforced by the API. */
export function isSafeHttpsRedirect(raw: string): boolean {
  return isHttpsUrl(raw);
}
