/**
 * PII Masking Utilities
 * Masks sensitive personally identifiable information for display in logs and UI
 */

export class PIIMasker {
  /**
   * Mask email address (shows first 2 chars and domain)
   * Example: john.doe@example.com -> jo***@example.com
   */
  static maskEmail(email: string): string {
    if (!email || !email.includes('@')) {
      return email;
    }

    const [localPart, domain] = email.split('@');
    if (localPart.length <= 2) {
      return `${localPart[0]}***@${domain}`;
    }

    const visible = localPart.substring(0, 2);
    return `${visible}***@${domain}`;
  }

  /**
   * Mask phone number (shows last 4 digits)
   * Example: +233241234567 -> +233******4567
   */
  static maskPhone(phone: string): string {
    if (!phone || phone.length < 4) {
      return phone;
    }

    const last4 = phone.slice(-4);
    const prefix = phone.slice(0, -4);
    return `${prefix.replace(/\d/g, '*')}${last4}`;
  }

  /**
   * Mask full name (shows first letter of first name and last name)
   * Example: John Doe -> J*** D***
   */
  static maskName(firstName?: string, lastName?: string): string {
    if (!firstName && !lastName) {
      return 'N/A';
    }

    const first = firstName ? `${firstName[0]}***` : '';
    const last = lastName ? `${lastName[0]}***` : '';
    return [first, last].filter(Boolean).join(' ');
  }

  /**
   * Mask user ID (shows first 4 and last 4 chars)
   * Example: 12345678-1234-1234-1234-123456789012 -> 1234...9012
   */
  static maskUserId(userId: string): string {
    if (!userId || userId.length < 8) {
      return userId;
    }

    if (userId.length <= 12) {
      return `${userId.substring(0, 4)}***`;
    }

    return `${userId.substring(0, 4)}...${userId.slice(-4)}`;
  }

  /**
   * Mask bank account number (shows last 4 digits)
   */
  static maskAccountNumber(accountNumber: string): string {
    if (!accountNumber || accountNumber.length < 4) {
      return accountNumber;
    }

    const last4 = accountNumber.slice(-4);
    return `****${last4}`;
  }

  /**
   * Mask any string (shows first 2 and last 2 chars)
   */
  static maskString(value: string, minLength: number = 6): string {
    if (!value || value.length < minLength) {
      return '***';
    }

    if (value.length <= 4) {
      return '***';
    }

    return `${value.substring(0, 2)}***${value.slice(-2)}`;
  }
}




