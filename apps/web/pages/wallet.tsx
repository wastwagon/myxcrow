import CustomerLayout from '@/components/CustomerLayout';
import { isAdmin, getUser } from '@/lib/auth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { formatCurrency } from '@/lib/utils';
import {
  ArrowLeftRight,
  Banknote,
  Clock,
  Headphones,
  Landmark,
  LayoutDashboard,
  Plus,
  Shield,
} from 'lucide-react';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { PageSpinner } from '@/components/LoadingSkeleton';
import { useIsMobileNav } from '@/lib/hooks/useMediaQuery';
import { useRequireAuth } from '@/lib/hooks/useRequireAuth';
import { CustomerShellChrome, SHELL_WALLET_CONTENT_CLASS } from '@/components/home/CustomerShellChrome';
import { HomeWalletCard } from '@/components/home/HomeWalletCard';
import { WalletMenuGrid, type WalletMenuTile } from '@/components/wallet/WalletMenuGrid';

import { useHideBalance } from '@/lib/hooks/useHideBalance';

interface Wallet {
  id: string;
  userId: string;
  currency: string;
  availableCents: number;
  pendingCents: number;
  createdAt: string;
  updatedAt: string;
}

function buildWalletMenuTiles(pendingLabel?: string, admin?: boolean): WalletMenuTile[] {
  const tiles: WalletMenuTile[] = [
    { href: '/wallet/topup', label: 'Top up', subtitle: 'MoMo or card', icon: Plus, color: 'green' },
    { href: '/wallet/withdraw', label: 'Withdraw', subtitle: 'Cash out', icon: Banknote, color: 'maroon' },
    {
      href: '/wallet/transactions',
      label: 'Transactions',
      subtitle: 'Top-ups & cash out',
      icon: ArrowLeftRight,
      color: 'indigo',
    },
    {
      href: '/wallet/payout-methods',
      label: 'Payout methods',
      subtitle: 'Bank & MoMo',
      icon: Landmark,
      color: 'teal',
    },
    {
      href: '/escrows/history?tab=needs',
      label: 'Pending',
      subtitle: pendingLabel || 'In escrow',
      icon: Clock,
      color: 'orange',
    },
    { href: '/escrows/history', label: 'Escrows', subtitle: 'History', icon: Shield, color: 'blue' },
    { href: '/help', label: 'Help', subtitle: 'Get support', icon: Headphones, color: 'gray' },
  ];

  if (admin) {
    tiles.push({
      href: '/admin',
      label: 'Admin',
      subtitle: 'Dashboard',
      icon: LayoutDashboard,
      color: 'maroon',
    });
  }

  return tiles;
}

export default function WalletPage() {
  const queryClient = useQueryClient();
  const isMobile = useIsMobileNav();
  const authed = useRequireAuth();
  const admin = isAdmin();
  const { hidden: hideBalance, toggle: toggleBalanceHidden, ready: balancePrefsReady } = useHideBalance();

  const { data: wallet, isLoading: walletLoading } = useQuery<Wallet>({
    queryKey: ['wallet'],
    queryFn: async () => (await apiClient.get('/wallet')).data,
    staleTime: 0,
    refetchInterval: 30000,
    enabled: authed,
  });

  if (!authed) {
    return <PageSpinner />;
  }

  const refreshWallet = async () => {
    await queryClient.invalidateQueries({ queryKey: ['wallet'] });
  };

  const currentUser = getUser();
  const accountLabel = currentUser?.phone || currentUser?.email || 'Your wallet';
  const available = wallet?.availableCents ?? 0;
  const pending = wallet?.pendingCents ?? 0;
  const pendingLabel = walletLoading ? undefined : formatCurrency(pending, 'GHS');

  return (
    <CustomerLayout title="Wallet" variant="home">
      <PullToRefresh onRefresh={refreshWallet} disabled={!isMobile}>
        <CustomerShellChrome screenTitle="Wallet" />
        <div className={SHELL_WALLET_CONTENT_CLASS}>
          <HomeWalletCard
            accountLabel={accountLabel}
            availableCents={available}
            pendingCents={pending}
            loading={walletLoading || !balancePrefsReady}
            hidden={hideBalance}
            onToggleHidden={toggleBalanceHidden}
          />
          <WalletMenuGrid tiles={buildWalletMenuTiles(pendingLabel, admin)} />
        </div>
      </PullToRefresh>
    </CustomerLayout>
  );
}
