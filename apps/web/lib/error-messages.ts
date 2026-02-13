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

  if (status === 429) return 'Too many requests. Please wait a moment and try again.';
  if (status === 401) return 'Session expired. Please sign in again.';
  if (status === 403) return apiMsg ? String(apiMsg) : 'You do not have permission to perform this action.';

  if (apiMsg) {
    return Array.isArray(apiMsg) ? apiMsg.join('. ') : String(apiMsg);
  }

  return err.message && typeof err.message === 'string' ? err.message : fallback;
}
