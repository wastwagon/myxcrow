import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import CustomerLayout from '@/components/CustomerLayout';
import { getUser, isAdmin } from '@/lib/auth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import {
  Briefcase,
  Clock,
  FileText,
  Flag,
  Headphones,
  KeyRound,
  Landmark,
  Package,
  PackageCheck,
  Plus,
  Wallet,
} from 'lucide-react';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { useIsMobileNav } from '@/lib/hooks/useMediaQuery';
import { useRequireAuth } from '@/lib/hooks/useRequireAuth';
import { PageSpinner } from '@/components/LoadingSkeleton';
import { ImageCard, ImageCardRow } from '@/components/ui/ImageCard';
import {
  CustomerShellChrome,
  SHELL_WALLET_CONTENT_CLASS,
} from '@/components/home/CustomerShellChrome';
import { HomeWalletCard } from '@/components/home/HomeWalletCard';
import { HomeCategoryTabs, HOME_TABPANEL_ID, type HomeCategory } from '@/components/home/HomeCategoryTabs';
import { HomeServiceGrid, type HomeServiceTile } from '@/components/home/HomeServiceGrid';

import { useHideBalance } from '@/lib/hooks/useHideBalance';

const HOME_MENU_CARDS = [
  {
    href: '/escrows/new?category=PHYSICAL_GOODS',
    title: 'Goods',
    description: 'Hold payment until the item is delivered.',
    image: '/images/v2/goods-services.jpg',
    icon: Package,
  },
  {
    href: '/escrows/new?category=PROFESSIONAL_SERVICE',
    title: 'Services',
    description: 'Protect work until the job is done.',
    image: '/images/v2/local-transactions.jpg',
    icon: Briefcase,
  },
  {
    href: '/escrows/new?milestones=1',
    title: 'Milestones',
    description: 'Release funds in stages as work lands.',
    image: '/images/v2/milestone-projects.jpg',
    icon: Flag,
  },
];

const PROTECT_TILES: HomeServiceTile[] = [
  { href: '/escrows/new', label: 'New escrow', icon: Plus },
  { href: '/escrows/new?category=PHYSICAL_GOODS', label: 'Goods', icon: Package },
  { href: '/escrows/new?category=PROFESSIONAL_SERVICE', label: 'Services', icon: Briefcase },
  { href: '/escrows/new?milestones=1', label: 'Milestones', icon: Flag },
  { href: '/escrows/new?pin=1', label: 'Delivery PIN', icon: KeyRound },
  { href: '/confirm-delivery', label: 'Confirm', icon: PackageCheck },
];

const WALLET_TILES: HomeServiceTile[] = [
  { href: '/wallet/topup', label: 'Top up', icon: Plus },
  { href: '/wallet/withdraw', label: 'Withdraw', icon: Wallet },
  { href: '/wallet/transactions', label: 'Transactions', icon: FileText },
  { href: '/wallet/payout-methods', label: 'Payout methods', icon: Landmark },
  { href: '/escrows/history?tab=needs', label: 'Pending', icon: Clock },
  { href: '/help', label: 'Help', icon: Headphones },
];

interface WalletData {
  availableCents: number;
  pendingCents: number;
  currency: string;
}

export default function Dashboard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isMobile = useIsMobileNav();
  const authed = useRequireAuth();
  const [category, setCategory] = useState<HomeCategory>('foryou');
  const { hidden: hideBalance, toggle: toggleBalanceHidden, ready: balancePrefsReady } = useHideBalance();

  useEffect(() => {
    if (!authed) return;
    if (isAdmin()) {
      router.replace('/admin');
    }
  }, [authed, router]);

  const { data: wallet, isLoading: walletLoading } = useQuery<WalletData>({
    queryKey: ['wallet'],
    queryFn: async () => (await apiClient.get('/wallet')).data,
    staleTime: 0,
    refetchInterval: 30000,
    enabled: authed && !isAdmin(),
  });

  if (!authed || isAdmin()) {
    return <PageSpinner />;
  }

  const user = getUser();
  const available = wallet?.availableCents ?? 0;
  const pending = wallet?.pendingCents ?? 0;
  const accountLabel = user?.phone || user?.email || 'Your wallet';

  const refreshDashboard = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['wallet'] }),
      queryClient.invalidateQueries({ queryKey: ['escrows'] }),
    ]);
  };

  return (
    <CustomerLayout title="Home" variant="home">
      <PullToRefresh onRefresh={refreshDashboard} disabled={!isMobile}>
        <CustomerShellChrome screenTitle="Home" />
        <div className={SHELL_WALLET_CONTENT_CLASS}>
          <HomeWalletCard
            accountLabel={accountLabel}
            availableCents={available}
            pendingCents={pending}
            loading={walletLoading || !balancePrefsReady}
            hidden={hideBalance}
            onToggleHidden={toggleBalanceHidden}
          />

          <HomeCategoryTabs value={category} onChange={setCategory} />
          <div
            role="tabpanel"
            id={HOME_TABPANEL_ID}
            aria-labelledby={`home-tab-${category}`}
            className="mt-4 pb-4"
          >
            {category === 'foryou' ? (
              <ImageCardRow columns={3}>
                {HOME_MENU_CARDS.map((card, index) => (
                  <ImageCard
                    key={card.title}
                    href={card.href}
                    title={card.title}
                    description={card.description}
                    image={card.image}
                    icon={card.icon}
                    priority={index === 0}
                    mobileWidthClassName="w-[68vw] max-w-[240px]"
                  />
                ))}
              </ImageCardRow>
            ) : (
              <HomeServiceGrid tiles={category === 'wallet' ? WALLET_TILES : PROTECT_TILES} />
            )}
          </div>
        </div>
      </PullToRefresh>
    </CustomerLayout>
  );
}
