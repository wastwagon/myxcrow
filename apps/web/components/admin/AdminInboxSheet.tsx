import Link from 'next/link';
import {
  AlertCircle,
  ChevronRight,
  Headphones,
  LayoutDashboard,
  Users,
  Wallet,
} from 'lucide-react';
import { Sheet } from '@/components/ui/Sheet';

export function AdminInboxSheet({
  open,
  onClose,
  disputeCount,
  withdrawalCount,
  supportCount = 0,
}: {
  open: boolean;
  onClose: () => void;
  disputeCount: number;
  withdrawalCount: number;
  supportCount?: number;
}) {
  return (
    <Sheet open={open} onClose={onClose} title="Inbox" subtitle="Work waiting for you">
      <div className="overflow-hidden rounded-[20px] bg-white">
        <InboxRow
          href="/admin"
          icon={LayoutDashboard}
          title="Work queue"
          subtitle="Disputes, withdrawals, and hot escrows"
          onClose={onClose}
        />
        <InboxRow
          href="/admin/support"
          icon={Headphones}
          title="Live support"
          subtitle="Buyer and seller help chats"
          badge={supportCount}
          onClose={onClose}
        />
        <InboxRow
          href="/disputes"
          icon={AlertCircle}
          title="Disputes"
          subtitle="Open cases that need a decision"
          badge={disputeCount}
          onClose={onClose}
        />
        <InboxRow
          href="/admin/withdrawals"
          icon={Wallet}
          title="Withdrawals"
          subtitle="Payouts waiting for approval"
          badge={withdrawalCount}
          onClose={onClose}
        />
        <InboxRow
          href="/admin/users"
          icon={Users}
          title="Users"
          subtitle="Search, credit, and manage accounts"
          onClose={onClose}
        />
      </div>
    </Sheet>
  );
}

function InboxRow({
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
