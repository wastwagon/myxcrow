/**
 * Map API errors to user-friendly messages.
 * Use when displaying errors to users (toast, form errors, etc.).
 */
export function getErrorMessage(error: unknown, fallback = 'Something went wrong. Please try again.'): string {
  if (!error) return fallback;

  const err = error as { response?: { status?: number; data?: { message?: string | string[] } }; message?: string; code?: string };

  // Network / timeout
  if (err.code === 'ECONNABORTED' || err.message?.includes('timeout')) {
    return 'Request timed out. Please check your connection and try again.';
  }
  if (err.code === 'ECONNREFUSED' || err.message?.includes('Network Error')) {
    return 'Cannot connect to server. Please check your connection.';
  }

  // HTTP status
  const status = err.response?.status;
  const apiMsg = err.response?.data?.message;
  const msg = Array.isArray(apiMsg) ? apiMsg.join('. ') : (apiMsg ? String(apiMsg) : '');

  if (status === 429) return 'Too many requests. Please wait a moment and try again.';
  if (status === 401) return 'Session expired. Please sign in again.';
  if (status === 403) return msg || 'You do not have permission to perform this action.';

  // Registration / OTP: map API messages to clear, actionable text
  if (status === 400 && msg) {
    const lower = msg.toLowerCase();
    if (lower.includes('invalid') && lower.includes('verification code')) {
      return 'The code you entered is wrong or has expired. Tap "Resend code" and enter the new 6-digit code from your SMS.';
    }
    if (lower.includes('email already exists')) {
      return 'This email is already registered. Sign in instead, or use a different email.';
    }
    if (lower.includes('phone') && lower.includes('already registered')) {
      return 'This phone number is already registered. Sign in instead, or use a different phone.';
    }
    if (lower.includes('sms disabled')) {
      return 'SMS is not configured. Set OTP_DEV_BYPASS=true on the server to get a code for testing, or configure Arkesel for real SMS.';
    }
    if (lower.includes('arkesel') && lower.includes('api key')) {
      return 'SMS is not configured. Add ARKESEL_API_KEY on the server, or set OTP_DEV_BYPASS=true for testing.';
    }
    if (lower.includes('wait') && lower.includes('seconds')) {
      return msg; // e.g. "Please wait 60 seconds before requesting another code"
    }
    if (lower.includes('ghana phone') || lower.includes('0551234567')) {
      return 'Enter a valid Ghana phone number (e.g. 0242565695). Must start with 0 and have 10 digits.';
    }
    if (lower.includes('failed to send') || lower.includes('verification code')) {
      return msg;
    }
  }

  if (msg) return msg;

  return err.message && typeof err.message === 'string' ? err.message : fallback;
}
