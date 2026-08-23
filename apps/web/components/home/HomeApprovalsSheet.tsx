import Link from 'next/link';
import {
  AlertCircle,
  ChevronRight,
  Clock,
  PackageCheck,
  Wallet,
} from 'lucide-react';
import { Sheet } from '@/components/ui/Sheet';

export function HomeApprovalsSheet({
  open,
  onClose,
  awaitingCount,
}: {
  open: boolean;
  onClose: () => void;
  awaitingCount: number;
}) {
  return (
    <Sheet open={open} onClose={onClose} title="Approvals" subtitle="Things waiting for you">
      <div className="overflow-hidden rounded-[20px] bg-white">
        <ApprovalRow
          href="/confirm-delivery"
          icon={PackageCheck}
          title="Confirm delivery"
          subtitle="Release with a PIN or delivery code"
          onClose={onClose}
        />
        <ApprovalRow
          href="/escrows/history?tab=needs"
          icon={Clock}
          title="Awaiting you"
          subtitle="Funding, shipment, or release"
          badge={awaitingCount}
          onClose={onClose}
        />
        <ApprovalRow
          href="/disputes"
          icon={AlertCircle}
          title="Disputes"
          subtitle="Open cases and evidence"
          onClose={onClose}
        />
        <ApprovalRow
          href="/wallet/transactions"
          icon={Wallet}
          title="Transactions"
          subtitle="Top-ups and withdrawals"
          onClose={onClose}
        />
      </div>
    </Sheet>
  );
}

function ApprovalRow({
  href,
  icon: Icon,
  title,
  subtitle,
  badge,
  onClose,
}: {
  href: string;
  icon: typeof Wallet;
  title: string;
  subtitle: string;
  badge?: number;
  onClose: () => void;
}) {
  return (
    <Link
      href={href}
      onClick={onClose}
      className="group flex min-h-[68px] items-center gap-3.5 px-3.5 py-3 touch-manipulation border-b border-black/[0.06] last:border-b-0 active:bg-black/[0.04] xl:hover:bg-black/[0.03]"
    >
      <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#f2f2f7] text-brand-maroon-deep">
        <Icon className="h-5 w-5" strokeWidth={1.85} aria-hidden />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-[16px] font-semibold text-brand-maroon-deep">{title}</span>
        <span className="block text-[13px] leading-snug text-[rgba(60,60,67,0.55)]">{subtitle}</span>
      </span>
      <span className="flex shrink-0 items-center gap-1.5">
        {badge != null && badge > 0 ? (
          <span className="inline-flex min-h-[22px] min-w-[22px] items-center justify-center rounded-full bg-brand-gold px-1.5 text-[11px] font-semibold text-brand-maroon-black">
            {badge > 9 ? '9+' : badge}
          </span>
        ) : null}
        <ChevronRight
          className="h-5 w-5 text-brand-gold transition-transform duration-200 xl:group-hover:translate-x-0.5"
          strokeWidth={2.2}
          aria-hidden
        />
      </span>
    </Link>
  );
}
