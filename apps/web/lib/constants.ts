/**
 * Shared Constants
 * Centralized constants for consistent use across the application
 */

/** Ghana Cedis symbol for display (₵) */
export const CURRENCY_SYMBOL = '₵';

/**
 * Escrow Status Colors
 * Consistent color mapping for escrow status badges
 */
export const ESCROW_STATUS_COLORS: Record<string, string> = {
  DRAFT: 'bg-gray-100 text-gray-800 border-gray-200',
  AWAITING_FUNDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  FUNDED: 'bg-blue-100 text-blue-800 border-blue-200',
  AWAITING_SHIPMENT: 'bg-purple-100 text-purple-800 border-purple-200',
  SHIPPED: 'bg-indigo-100 text-indigo-800 border-indigo-200',
  IN_TRANSIT: 'bg-cyan-100 text-cyan-800 border-cyan-200',
  DELIVERED: 'bg-green-100 text-green-800 border-green-200',
  AWAITING_RELEASE: 'bg-orange-100 text-orange-800 border-orange-200',
  RELEASED: 'bg-gray-100 text-gray-800 border-gray-200',
  REFUNDED: 'bg-red-100 text-red-800 border-red-200',
  CANCELLED: 'bg-gray-100 text-gray-800 border-gray-200',
  DISPUTED: 'bg-red-100 text-red-800 border-red-200',
};

/**
 * Dispute Status Colors
 */
export const DISPUTE_STATUS_COLORS: Record<string, string> = {
  OPEN: 'bg-red-100 text-red-800 border-red-200',
  NEGOTIATION: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  MEDIATION: 'bg-orange-100 text-orange-800 border-orange-200',
  ARBITRATION: 'bg-purple-100 text-purple-800 border-purple-200',
  RESOLVED: 'bg-green-100 text-green-800 border-green-200',
  CLOSED: 'bg-gray-100 text-gray-800 border-gray-200',
};

/**
 * Payment Status Colors
 */
export const PAYMENT_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  PROCESSING: 'bg-blue-100 text-blue-800 border-blue-200',
  COMPLETED: 'bg-green-100 text-green-800 border-green-200',
  FAILED: 'bg-red-100 text-red-800 border-red-200',
  CANCELLED: 'bg-gray-100 text-gray-800 border-gray-200',
};

/**
 * Withdrawal Status Colors
 */
export const WITHDRAWAL_STATUS_COLORS: Record<string, string> = {
  REQUESTED: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  PROCESSING: 'bg-blue-100 text-blue-800 border-blue-200',
  SUCCEEDED: 'bg-green-100 text-green-800 border-green-200',
  FAILED: 'bg-red-100 text-red-800 border-red-200',
  CANCELED: 'bg-gray-100 text-gray-800 border-gray-200',
};

/**
 * KYC Status Colors
 */
export const KYC_STATUS_COLORS: Record<string, string> = {
  PENDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
  IN_PROGRESS: 'bg-blue-100 text-blue-800 border-blue-200',
  VERIFIED: 'bg-green-100 text-green-800 border-green-200',
  REJECTED: 'bg-red-100 text-red-800 border-red-200',
  EXPIRED: 'bg-gray-100 text-gray-800 border-gray-200',
};

/**
 * Active Escrow Statuses
 * Statuses that indicate an escrow is still active
 */
export const ACTIVE_ESCROW_STATUSES = [
  'DRAFT',
  'AWAITING_FUNDING',
  'FUNDED',
  'AWAITING_SHIPMENT',
  'SHIPPED',
  'IN_TRANSIT',
  'DELIVERED',
  'AWAITING_RELEASE',
  'DISPUTED',
];

/**
 * Completed Escrow Statuses
 */
export const COMPLETED_ESCROW_STATUSES = ['RELEASED', 'REFUNDED', 'CANCELLED'];

/**
 * Format status for display (replace underscores with spaces)
 */
export function formatStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}
