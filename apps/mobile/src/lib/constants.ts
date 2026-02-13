// API Configuration
export const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:4000/api';

// Web app base URL (for Terms, Privacy, Support links in mobile app)
export const WEB_BASE_URL = process.env.EXPO_PUBLIC_WEB_BASE_URL || 'https://myxcrow.com';

// App Configuration
export const APP_NAME = 'MYXCROW';
export const APP_VERSION = '1.0.0';

// Currency
export const DEFAULT_CURRENCY = 'GHS';
export const DEFAULT_COUNTRY = 'GH';
/** Ghana Cedis symbol for display (₵) */
export const CURRENCY_SYMBOL = '₵';

// Escrow Status
export enum EscrowStatus {
  PENDING = 'PENDING',
  FUNDED = 'FUNDED',
  SHIPPED = 'SHIPPED',
  DELIVERED = 'DELIVERED',
  RELEASED = 'RELEASED',
  CANCELLED = 'CANCELLED',
  DISPUTED = 'DISPUTED',
}

// Dispute Status
export enum DisputeStatus {
  OPEN = 'OPEN',
  IN_REVIEW = 'IN_REVIEW',
  RESOLVED = 'RESOLVED',
  CLOSED = 'CLOSED',
}

// KYC Status
export enum KYCStatus {
  PENDING = 'PENDING',
  APPROVED = 'APPROVED',
  REJECTED = 'REJECTED',
}

// User Roles
export enum UserRole {
  BUYER = 'BUYER',
  SELLER = 'SELLER',
  ADMIN = 'ADMIN',
}

// Format currency
export function formatCurrency(amount: number, currency: string = DEFAULT_CURRENCY): string {
  return new Intl.NumberFormat('en-GH', {
    style: 'currency',
    currency: currency,
  }).format(amount / 100); // Assuming amounts are in cents
}

// Format date
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Intl.DateTimeFormat('en-GH', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(d);
}

// Format status
export function formatStatus(status: string): string {
  return status
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ');
}
