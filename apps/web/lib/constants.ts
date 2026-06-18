/**
 * Shared Constants
 * Centralized constants for consistent use across the application
 */

/** Ghana Cedis symbol for display (₵) */
export const CURRENCY_SYMBOL = '₵';

/** Status badge classes for the dark app shell (translucent + border). */
const darkStatus = {
  neutral: 'bg-white/10 text-white/80 border-white/15',
  yellow: 'bg-yellow-500/20 text-yellow-200 border-yellow-500/30',
  blue: 'bg-blue-500/20 text-blue-200 border-blue-500/30',
  purple: 'bg-purple-500/20 text-purple-200 border-purple-500/30',
  indigo: 'bg-indigo-500/20 text-indigo-200 border-indigo-500/30',
  cyan: 'bg-cyan-500/20 text-cyan-200 border-cyan-500/30',
  green: 'bg-emerald-500/20 text-emerald-200 border-emerald-500/30',
  orange: 'bg-orange-500/20 text-orange-200 border-orange-500/30',
  red: 'bg-red-500/20 text-red-200 border-red-500/30',
} as const;

/**
 * Escrow Status Colors
 * Consistent color mapping for escrow status badges on dark backgrounds
 */
export const ESCROW_STATUS_COLORS: Record<string, string> = {
  DRAFT: darkStatus.neutral,
  AWAITING_FUNDING: darkStatus.yellow,
  FUNDED: darkStatus.blue,
  AWAITING_SHIPMENT: darkStatus.purple,
  SHIPPED: darkStatus.indigo,
  IN_TRANSIT: darkStatus.cyan,
  DELIVERED: darkStatus.green,
  AWAITING_RELEASE: darkStatus.orange,
  RELEASED: darkStatus.neutral,
  REFUNDED: darkStatus.red,
  CANCELLED: darkStatus.neutral,
  DISPUTED: darkStatus.red,
};

/**
 * Dispute Status Colors
 */
export const DISPUTE_STATUS_COLORS: Record<string, string> = {
  OPEN: darkStatus.red,
  NEGOTIATION: darkStatus.yellow,
  MEDIATION: darkStatus.orange,
  ARBITRATION: darkStatus.purple,
  RESOLVED: darkStatus.green,
  CLOSED: darkStatus.neutral,
};

/**
 * Payment Status Colors
 */
export const PAYMENT_STATUS_COLORS: Record<string, string> = {
  PENDING: darkStatus.yellow,
  PROCESSING: darkStatus.blue,
  COMPLETED: darkStatus.green,
  FAILED: darkStatus.red,
  CANCELLED: darkStatus.neutral,
};

/**
 * Withdrawal Status Colors
 */
export const WITHDRAWAL_STATUS_COLORS: Record<string, string> = {
  REQUESTED: darkStatus.yellow,
  PROCESSING: darkStatus.blue,
  SUCCEEDED: darkStatus.green,
  FAILED: darkStatus.red,
  CANCELED: darkStatus.neutral,
};

/** User-facing withdrawal method labels (from @myxcrow/shared) */
export {
  WITHDRAWAL_METHOD_LABELS,
  WITHDRAWAL_STATUS_LABELS,
} from '@myxcrow/shared';

import {
  WITHDRAWAL_METHOD_LABELS,
  WITHDRAWAL_STATUS_LABELS,
} from '@myxcrow/shared';

export function formatWithdrawalMethodLabel(methodType: string): string {
  return WITHDRAWAL_METHOD_LABELS[methodType] ?? formatStatus(methodType);
}

export function formatWithdrawalStatusLabel(status: string): string {
  return WITHDRAWAL_STATUS_LABELS[status] ?? formatStatus(status);
}

/**
 * KYC Status Colors
 */
export const KYC_STATUS_COLORS: Record<string, string> = {
  PENDING: darkStatus.yellow,
  IN_PROGRESS: darkStatus.blue,
  VERIFIED: darkStatus.green,
  REJECTED: darkStatus.red,
  EXPIRED: darkStatus.neutral,
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

/** Escrow statuses where a dispute can be opened */
export const DISPUTE_ELIGIBLE_ESCROW_STATUSES = [
  'FUNDED',
  'SHIPPED',
  'IN_TRANSIT',
  'DELIVERED',
  'AWAITING_RELEASE',
  'RELEASED',
];

/**
 * Format status for display (replace underscores with spaces)
 */
export function formatStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase());
}
