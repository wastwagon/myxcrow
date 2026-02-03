// Support chat entry-point for mobile app.
//
// We intentionally avoid a native Intercom SDK placeholder here.
// Instead, we open the web Support page (which can host Intercom Messenger or any chat widget).
//
// Configure this in your mobile environment:
// - EXPO_PUBLIC_WEB_APP_URL=https://myxcrow.com

export interface IntercomUser {
  id: string;
  email: string;
  name?: string;
}

export async function initializeIntercom() {
  // No-op for web-based support flow.
}

export async function registerUser(user: IntercomUser) {
  // No-op for web-based support flow (chat widget handles identity on web).
  void user;
}

export async function unregisterUser() {
  // No-op for web-based support flow.
}

export function showMessenger() {
  const url = `${process.env.EXPO_PUBLIC_WEB_APP_URL || 'https://myxcrow.com'}/support`;
  // Lazy import to avoid any linking issues in environments without Linking configured.
  // eslint-disable-next-line @typescript-eslint/no-floating-promises
  import('react-native').then(({ Linking }) => Linking.openURL(url));
}

export function hideMessenger() {
  // Not applicable for external browser flow.
}
