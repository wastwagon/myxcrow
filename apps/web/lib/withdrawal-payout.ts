export type WithdrawalMethodType = 'BANK_ACCOUNT' | 'MOBILE_MONEY';

export {
  GHANA_BANKS,
  MOBILE_MONEY_NETWORKS,
} from '@myxcrow/shared';
export type { MobileMoneyNetwork } from '@myxcrow/shared';

import {
  formatWithdrawalMethodLabel,
  formatWithdrawalStatusLabel,
} from '@/lib/constants';

export { formatWithdrawalMethodLabel, formatWithdrawalStatusLabel };

export interface WithdrawalPayoutDetails {
  accountName?: string;
  accountNumber?: string;
  bankName?: string;
  branch?: string;
  mobileNumber?: string;
  network?: string;
}

export interface SavedPayoutMethod {
  id: string;
  methodType: WithdrawalMethodType;
  methodLabel: string;
  label?: string | null;
  payoutSummary: string;
  details: WithdrawalPayoutDetails;
  isDefault: boolean;
  createdAt: string;
  updatedAt: string;
}

export function formatPayoutSummary(
  methodType: string,
  details?: WithdrawalPayoutDetails | null,
  payoutSummary?: string | null,
): string {
  if (payoutSummary) return payoutSummary;
  if (!details) return formatWithdrawalMethodLabel(methodType);

  if (methodType === 'BANK_ACCOUNT') {
    const bank = details.bankName || 'Bank';
    const acct = details.accountNumber || '****';
    return `${bank} • ${acct}`;
  }
  if (methodType === 'MOBILE_MONEY') {
    const network = details.network || 'MoMo';
    const phone = details.mobileNumber || '****';
    return `${network} • ${phone}`;
  }
  return formatWithdrawalMethodLabel(methodType);
}
