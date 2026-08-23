import Link from 'next/link';
import { ArrowDownToLine, ArrowLeftRight, ArrowUpFromLine, Eye, EyeOff } from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

export function HomeWalletCard({
  accountLabel,
  availableCents,
  pendingCents,
  loading,
  hidden,
  onToggleHidden,
}: {
  accountLabel: string;
  availableCents: number;
  pendingCents: number;
  loading: boolean;
  hidden: boolean;
  onToggleHidden: () => void;
}) {
  const available = hidden ? '••••••' : formatCurrency(availableCents, 'GHS');
  const pending = hidden ? '••••' : formatCurrency(pendingCents, 'GHS');

  return (
    <section className="mx-wallet-card relative overflow-hidden rounded-[20px] bg-white" aria-label="Wallet">
      <div className="absolute left-0 top-0 rounded-br-[12px] bg-brand-gold px-3 py-1">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-brand-maroon-black">
          Wallet
        </p>
      </div>
      <div className="px-5 pb-1 pt-9">
        <p className="truncate text-[13px] text-[rgba(60,60,67,0.62)]">{accountLabel}</p>
        {loading ? (
          <div className="mt-1 h-9 w-44 animate-pulse rounded-[12px] bg-black/5" />
        ) : (
          <div className="mt-0.5 flex min-w-0 items-center gap-1">
            <p className="min-w-0 truncate text-[28px] font-semibold tracking-tight text-brand-maroon-deep leading-tight">
              {available}
            </p>
            <button
              type="button"
              onClick={onToggleHidden}
              className="inline-flex min-h-[44px] min-w-[44px] shrink-0 items-center justify-center text-brand-maroon-deep/70 touch-manipulation focus-visible:rounded-[12px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold"
              aria-label={hidden ? 'Show balance' : 'Hide balance'}
            >
              {hidden ? (
                <EyeOff className="h-5 w-5" strokeWidth={1.9} />
              ) : (
                <Eye className="h-5 w-5" strokeWidth={1.9} />
              )}
            </button>
          </div>
        )}
        <p className="mt-1 truncate text-[13px] text-[rgba(60,60,67,0.62)]">
          Pending in escrow {loading ? '—' : pending}
        </p>
      </div>
      <div className="mt-3 grid grid-cols-3 border-t border-[rgba(60,60,67,0.12)]">
        <WalletAction href="/wallet/topup" icon={ArrowDownToLine} label="Top up" />
        <WalletAction
          href="/wallet/withdraw"
          icon={ArrowUpFromLine}
          label="Withdraw"
          divider
        />
        <WalletAction href="/wallet/transactions" icon={ArrowLeftRight} label="Transactions" divider />
      </div>
    </section>
  );
}

function WalletAction({
  href,
  icon: Icon,
  label,
  divider,
}: {
  href: string;
  icon: typeof ArrowDownToLine;
  label: string;
  divider?: boolean;
}) {
  return (
    <Link
      href={href}
      className={`flex min-h-[72px] flex-col items-center justify-center gap-1 px-1 py-3 text-brand-maroon-deep touch-manipulation active:bg-black/[0.03] focus-visible:z-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand-gold ${
        divider ? 'border-l border-[rgba(60,60,67,0.12)]' : ''
      }`}
    >
      <Icon className="h-5 w-5" strokeWidth={1.8} aria-hidden />
      <span className="max-w-full truncate text-[12px] font-medium">{label}</span>
    </Link>
  );
}
