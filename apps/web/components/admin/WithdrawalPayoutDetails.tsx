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
    <div className="flex justify-between gap-4 py-2 border-b border-white/10 last:border-0">
      <span className="text-sm text-white/60 shrink-0">{label}</span>
      <span className="text-sm text-white font-medium text-right break-all">{value}</span>
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
      <div className="p-4 rounded-ios-lg bg-white/5 border border-white/10 space-y-1">
        <p className="text-xs font-medium text-white/55 uppercase tracking-wide">User</p>
        <p className="font-medium text-white">{user?.email ?? '—'}</p>
        {(user?.firstName || user?.lastName) && (
          <p className="text-sm text-white/70">
            {[user?.firstName, user?.lastName].filter(Boolean).join(' ')}
          </p>
        )}
        {user?.phone && <p className="text-sm text-white/70">{user.phone}</p>}
        {user?.id && (
          <p className="text-xs text-white/50 font-mono">ID: {user.id}</p>
        )}
      </div>

      <div className="p-4 rounded-ios-lg bg-white/5 border border-white/10">
        <p className="text-xs font-medium text-white/55 uppercase tracking-wide mb-2">Amount</p>
        <p className="text-2xl font-bold text-white">
          {formatCurrency(withdrawal.amountCents, currency)}
        </p>
        {withdrawal.feeCents > 0 && (
          <p className="text-sm text-white/60 mt-1">
            Fee: {formatCurrency(withdrawal.feeCents, currency)}
          </p>
        )}
      </div>

      <div className="p-4 rounded-ios-lg bg-white/5 border border-white/10">
        <p className="text-xs font-medium text-white/55 uppercase tracking-wide mb-3">
          Payout method — {withdrawal.methodLabel || formatWithdrawalMethodLabel(withdrawal.methodType)}
        </p>

        {withdrawal.methodType === 'BANK_ACCOUNT' && (
          <>
            <DetailRow label="Account name" value={details.accountName} />
            <DetailRow label="Bank" value={details.bankName} />
            <DetailRow label="Branch" value={details.branch} />
            <DetailRow
              label="Account number"
              value={showSensitive ? details.accountNumber : details.accountNumber}
            />
          </>
        )}

        {withdrawal.methodType === 'MOBILE_MONEY' && (
          <>
            <DetailRow label="Network" value={details.network} />
            <DetailRow
              label="Mobile number"
              value={showSensitive ? details.mobileNumber : details.mobileNumber}
            />
            <DetailRow label="Registered name" value={details.accountName} />
          </>
        )}

        {!showSensitive && withdrawal.payoutSummary && (
          <p className="text-xs text-white/50 mt-2">Summary: {withdrawal.payoutSummary}</p>
        )}
      </div>

      <div className="p-4 rounded-ios-lg bg-white/5 border border-white/10 space-y-1">
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
