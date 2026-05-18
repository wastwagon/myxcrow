import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { isAuthenticated, getUser, isAdmin } from '@/lib/auth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import {
  FileText,
  Clock,
  CheckCircle,
  ArrowRight,
  Plus,
  Wallet,
  Activity,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { COMPLETED_ESCROW_STATUSES } from '@/lib/constants';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';
import { MetricCard } from '@/components/ui/MetricCard';
import { ListGroup, ListRow } from '@/components/ui/ListGroup';
import { StatusBadge } from '@/components/StatusBadge';
import { Button } from '@/components/ui/Button';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { useIsMobileNav } from '@/lib/hooks/useMediaQuery';
import { ListRowsSkeleton } from '@/components/LoadingSkeleton';

interface WalletData {
  availableCents: number;
  pendingCents: number;
  currency: string;
}

interface Escrow {
  id: string;
  status: string;
  amountCents: number;
  currency: string;
  description: string;
  createdAt: string;
}

export default function Dashboard() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isMobile = useIsMobileNav();
  const [userName, setUserName] = useState<string>('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mounted) return;
    if (!isAuthenticated()) {
      router.push('/login');
    } else {
      if (isAdmin()) {
        router.push('/admin');
        return;
      }

      const user = getUser();
      if (user) {
        const name = user.firstName || user.email?.split('@')[0] || 'User';
        setUserName(name);
      }
    }
  }, [router, mounted]);

  const { data: wallet, isLoading: walletLoading } = useQuery<WalletData>({
    queryKey: ['wallet'],
    queryFn: async () => {
      const response = await apiClient.get('/wallet');
      return response.data;
    },
    staleTime: 0,
    refetchInterval: 30000,
    enabled: mounted && isAuthenticated(),
  });

  const { data: escrowsData, isLoading: escrowsLoading } = useQuery<
    { data?: Escrow[]; escrows?: Escrow[]; total?: number } | Escrow[]
  >({
    queryKey: ['escrows'],
    queryFn: async () => {
      const response = await apiClient.get('/escrows');
      return response.data;
    },
    enabled: mounted && isAuthenticated(),
  });

  const escrows: Escrow[] = Array.isArray(escrowsData)
    ? escrowsData
    : escrowsData?.data || escrowsData?.escrows || [];

  if (!mounted || !isAuthenticated()) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-2 border-white/20 border-t-brand-gold" />
      </div>
    );
  }

  const activeEscrows = escrows?.filter((e) => !['RELEASED', 'CANCELLED'].includes(e.status)) || [];
  const recentEscrows = escrows?.slice(0, 5) || [];

  const refreshDashboard = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['wallet'] }),
      queryClient.invalidateQueries({ queryKey: ['escrows'] }),
    ]);
  };

  return (
    <Layout>
      <PullToRefresh onRefresh={refreshDashboard} disabled={!isMobile} className="space-y-6">
        <PageHeader
          title={`Welcome Back${userName ? `, ${userName}` : ''}!`}
          subtitle="Here's your account overview"
          icon={<FileText className="w-6 h-6" />}
        />

        {/* Hero balance + metrics */}
        <div className="rounded-ios-xl border border-brand-gold/30 bg-white/[0.09] backdrop-blur-sm p-6 shadow-ios-card ring-1 ring-brand-gold/20">
          <p className="text-ios-footnote font-medium text-label-secondary mb-1">Available balance</p>
          {walletLoading ? (
            <div className="h-10 w-40 bg-white/10 animate-pulse rounded-ios mb-2" />
          ) : (
            <p className="text-4xl font-bold text-label-primary tracking-tight mb-1">
              {wallet ? formatCurrency(wallet.availableCents, 'GHS') : '--'}
            </p>
          )}
          <p className="text-ios-subhead text-label-tertiary">
            {walletLoading
              ? 'Loading…'
              : wallet
                ? `${formatCurrency(wallet.pendingCents, 'GHS')} pending in escrow`
                : 'Top up your wallet to start'}
          </p>
          <div className="flex flex-wrap gap-3 mt-5">
            <Link href="/wallet/topup">
              <Button size="sm">Top up</Button>
            </Link>
            <Link href="/wallet">
              <Button size="sm" variant="tinted">
                Wallet
              </Button>
            </Link>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-4">
          <MetricCard
            label="Pending balance"
            value={wallet ? formatCurrency(wallet.pendingCents, 'GHS') : '--'}
            hint="Held in escrow"
            icon={<Clock className="w-5 h-5" />}
            accent="amber"
            loading={walletLoading}
          />
          <MetricCard
            label="Active escrows"
            value={activeEscrows.length}
            hint="In progress"
            icon={<FileText className="w-5 h-5" />}
            accent="maroon"
            loading={escrowsLoading}
          />
          <MetricCard
            label="Completed"
            value={escrows?.filter((e) => COMPLETED_ESCROW_STATUSES.includes(e.status)).length ?? 0}
            hint="All time"
            icon={<CheckCircle className="w-5 h-5" />}
            accent="emerald"
            loading={escrowsLoading}
          />
        </div>

        <ListGroup title="Quick actions">
          <ListRow
            href="/escrows/new"
            leading={
              <div className="w-9 h-9 rounded-ios-lg bg-brand-gold/20 flex items-center justify-center">
                <Plus className="w-5 h-5 text-brand-gold" />
              </div>
            }
            title="Create escrow"
            subtitle="Start a new transaction"
          />
          <ListRow
            href="/wallet"
            leading={
              <div className="w-9 h-9 rounded-ios-lg bg-emerald-500/20 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-emerald-400" />
              </div>
            }
            title="Manage wallet"
            subtitle="Transactions & withdrawals"
          />
          <ListRow
            href="/escrows"
            leading={
              <div className="w-9 h-9 rounded-ios-lg bg-brand-maroon/40 flex items-center justify-center">
                <FileText className="w-5 h-5 text-white/90" />
              </div>
            }
            title="All escrows"
            subtitle="View and filter agreements"
          />
        </ListGroup>

        <div>
          <div className="flex items-center justify-between px-1 mb-3">
            <h2 className="text-ios-title-3 text-label-primary font-semibold">Recent escrows</h2>
            <Link
              href="/escrows"
              className="text-brand-gold text-ios-footnote font-medium flex items-center gap-1"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {escrowsLoading ? (
            <ListRowsSkeleton rows={3} rowClassName="h-16" />
          ) : recentEscrows.length > 0 ? (
            <ListGroup>
              {recentEscrows.map((escrow) => (
                <ListRow
                  key={escrow.id}
                  href={`/escrows/${escrow.id}`}
                  title={escrow.description || 'Escrow Agreement'}
                  subtitle={
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-label-primary font-medium">
                        {formatCurrency(escrow.amountCents, 'GHS')}
                      </span>
                      <span>·</span>
                      <span>{formatDate(escrow.createdAt)}</span>
                    </span>
                  }
                  trailing={<StatusBadge status={escrow.status} />}
                />
              ))}
            </ListGroup>
          ) : (
            <div className="rounded-ios-xl border border-white/10 bg-white/[0.07] p-10 text-center">
              <FileText className="w-14 h-14 mx-auto mb-4 text-white/30" />
              <p className="text-ios-headline text-label-primary font-semibold mb-1">No escrows yet</p>
              <p className="text-ios-subhead text-label-secondary mb-6">
                Create your first escrow to protect a transaction
              </p>
              <Link href="/escrows/new">
                <Button>
                  <Plus className="w-5 h-5" />
                  Create escrow
                </Button>
              </Link>
            </div>
          )}
        </div>

        {activeEscrows.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <MetricCard
              label="Awaiting action"
              value={
                escrows?.filter((e) => ['AWAITING_FUNDING', 'AWAITING_SHIPMENT'].includes(e.status))
                  .length || 0
              }
              icon={<Clock className="w-5 h-5" />}
              accent="amber"
            />
            <MetricCard
              label="In progress"
              value={
                escrows?.filter((e) =>
                  ['FUNDED', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED'].includes(e.status)
                ).length || 0
              }
              icon={<Activity className="w-5 h-5" />}
              accent="emerald"
            />
            <MetricCard
              label="Completed"
              value={
                escrows?.filter((e) => COMPLETED_ESCROW_STATUSES.includes(e.status)).length || 0
              }
              icon={<CheckCircle className="w-5 h-5" />}
              accent="gold"
            />
          </div>
        )}
      </PullToRefresh>
    </Layout>
  );
}
