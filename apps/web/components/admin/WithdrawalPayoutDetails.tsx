import { formatCurrency, formatDate } from '@/lib/utils';
import {
  formatWithdrawalMethodLabel,
  formatWithdrawalStatusLabel,
  type WithdrawalPayoutDetails,
} from '@/lib/withdrawal-payout';

export interface WithdrawalRecord {
  id: string;
  amountCents: number;
  feeCents: number;
  currency?: string;
  status: string;
  methodType: string;
  methodLabel?: string;
  payoutSummary?: string;
  methodDetails?: WithdrawalPayoutDetails;
  createdAt: string;
  processedAt?: string;
  failureReason?: string;
  wallet?: {
    currency?: string;
    user?: {
      id: string;
      email: string;
      phone?: string | null;
      firstName?: string | null;
      lastName?: string | null;
    };
  };
}

function DetailRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div className="flex justify-between gap-4 py-2.5 border-b border-[rgba(60,60,67,0.12)] last:border-0">
      <span className="text-[15px] text-[rgba(60,60,67,0.6)] shrink-0">{label}</span>
      <span className="text-[15px] text-gray-900 font-medium text-right break-all">{value}</span>
    </div>
  );
}

export function WithdrawalPayoutDetailsView({
  withdrawal,
  showSensitive = false,
}: {
  withdrawal: WithdrawalRecord;
  showSensitive?: boolean;
}) {
  const details = withdrawal.methodDetails ?? {};
  const user = withdrawal.wallet?.user;
  const currency = withdrawal.currency || withdrawal.wallet?.currency || 'GHS';

  return (
    <div className="space-y-4">
      <div className="rounded-[12px] bg-white px-4 py-3 space-y-1">
        <p className="text-[13px] text-[rgba(60,60,67,0.6)]">User</p>
        <p className="text-[17px] font-semibold text-gray-900">{user?.email ?? '—'}</p>
        {(user?.firstName || user?.lastName) && (
          <p className="text-[15px] text-[rgba(60,60,67,0.6)]">
            {[user?.firstName, user?.lastName].filter(Boolean).join(' ')}
          </p>
        )}
        {user?.phone && <p className="text-[15px] text-[rgba(60,60,67,0.6)]">{user.phone}</p>}
        {user?.id && <p className="text-[13px] text-gray-500 font-mono">ID: {user.id}</p>}
      </div>

      <div className="rounded-[12px] bg-white px-4 py-3">
        <p className="text-[13px] text-[rgba(60,60,67,0.6)] mb-1">Amount</p>
        <p className="text-[28px] font-bold tracking-tight text-gray-900">
          {formatCurrency(withdrawal.amountCents, currency)}
        </p>
        {withdrawal.feeCents > 0 && (
          <p className="text-[15px] text-[rgba(60,60,67,0.6)] mt-1">
            Fee: {formatCurrency(withdrawal.feeCents, currency)}
          </p>
        )}
      </div>

      <div className="rounded-[12px] bg-white px-4 py-3">
        <p className="text-[13px] text-[rgba(60,60,67,0.6)] mb-2">
          Payout — {withdrawal.methodLabel || formatWithdrawalMethodLabel(withdrawal.methodType)}
        </p>

        {withdrawal.methodType === 'BANK_ACCOUNT' && (
          <>
            <DetailRow label="Account name" value={details.accountName} />
            <DetailRow label="Bank" value={details.bankName} />
            <DetailRow label="Branch" value={details.branch} />
            <DetailRow label="Account number" value={details.accountNumber} />
          </>
        )}

        {withdrawal.methodType === 'MOBILE_MONEY' && (
          <>
            <DetailRow label="Network" value={details.network} />
            <DetailRow label="Mobile number" value={details.mobileNumber} />
            <DetailRow label="Registered name" value={details.accountName} />
          </>
        )}

        {!showSensitive && withdrawal.payoutSummary && (
          <p className="text-[13px] text-[rgba(60,60,67,0.6)] mt-2">Summary: {withdrawal.payoutSummary}</p>
        )}
      </div>

      <div className="rounded-[12px] bg-white px-4 py-3 space-y-0">
        <DetailRow label="Status" value={formatWithdrawalStatusLabel(withdrawal.status)} />
        <DetailRow label="Requested" value={formatDate(withdrawal.createdAt)} />
        {withdrawal.processedAt && (
          <DetailRow label="Processed" value={formatDate(withdrawal.processedAt)} />
        )}
        {withdrawal.failureReason && (
          <DetailRow label="Denial reason" value={withdrawal.failureReason} />
        )}
        <DetailRow label="Reference" value={withdrawal.id.slice(0, 8)} />
      </div>
    </div>
  );
}
