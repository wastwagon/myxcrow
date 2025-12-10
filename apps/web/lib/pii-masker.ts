/**
 * Client-side PII Masking Utilities
 * Masks sensitive information for display in UI
 */

export class PIIMasker {
  /**
   * Mask email address (shows first 2 chars and domain)
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
   * Mask user ID (shows first 4 and last 4 chars)
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
}




