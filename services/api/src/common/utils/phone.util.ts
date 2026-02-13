/**
 * Ghana phone format: 0XXXXXXXXX (10 digits, no +233)
 * Accepts input with or without +233, normalizes to 0XXXXXXXXX
 */
export function normalizeGhanaPhone(input: string): string {
  if (!input || typeof input !== 'string') return '';
  let cleaned = input.trim().replace(/\s+/g, '');
  // Remove +233 prefix
  if (cleaned.startsWith('+233')) {
    cleaned = '0' + cleaned.slice(4);
  } else if (cleaned.startsWith('233') && cleaned.length === 12) {
    cleaned = '0' + cleaned.slice(3);
  }
  return cleaned;
}

/** Ghana phone regex: 0 followed by 9 digits (e.g. 0551234567, 0241234567) */
export const GHANA_PHONE_REGEX = /^0[0-9]{9}$/;

export function isValidGhanaPhone(input: string): boolean {
  return GHANA_PHONE_REGEX.test(normalizeGhanaPhone(input));
}
