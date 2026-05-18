import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { isAuthenticated, isAdmin } from '@/lib/auth';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { formatCurrency, formatDate } from '@/lib/utils';
import Link from 'next/link';
import { User } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { form } from '@/lib/form-classes';
import { AdminAvatar } from '@/components/admin/AdminIconBadge';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { useIsMobileNav } from '@/lib/hooks/useMediaQuery';
import { PageDetailSkeleton } from '@/components/LoadingSkeleton';

export default function AdminViewWalletPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isMobile = useIsMobileNav();
  const { userId } = router.query;

  const refreshAdminWallet = async () => {
    await queryClient.invalidateQueries({ queryKey: ['admin-wallet', userId] });
  };

  useEffect(() => {
    if (!isAuthenticated() || !isAdmin()) {
      router.push('/login');
    }
  }, [router]);

  const { data, isLoading, error } = useQuery({
    queryKey: ['admin-wallet', userId],
    queryFn: async () => {
      const r = await apiClient.get(`/wallet/admin/${userId}`);
      return r.data;
    },
    enabled: !!userId && isAuthenticated() && isAdmin(),
  });

  if (!isAuthenticated() || !isAdmin()) return null;

  if (isLoading) {
    return (
      <Layout>
        <PageDetailSkeleton />
      </Layout>
    );
  }

  if (error || !data) {
    return (
      <Layout>
        <div className="space-y-4">
          <button onClick={() => router.back()} className="text-brand-gold hover:text-brand-gold/80 transition-colors">
            ← Back
          </button>
          <p className="text-red-400">Failed to load wallet.</p>
        </div>
      </Layout>
    );
  }

  const { wallet, user } = data;

  return (
    <Layout>
      <PullToRefresh onRefresh={refreshAdminWallet} disabled={!isMobile} className="space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="text-brand-gold hover:text-brand-gold/80 transition-colors">
            ← Back
          </button>
        </div>
        <PageHeader
          title="View User Wallet"
          subtitle={user?.email}
          icon={<User className="w-6 h-6" />}
          gradient="blue"
        />

        <div className={form.panel}>
          <div className="flex items-center gap-3 mb-4">
            <AdminAvatar label={user?.email || 'User'} variant="maroon" />
            <h2 className="text-lg font-semibold text-label-primary">User</h2>
          </div>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <dt className="text-label-secondary">Email</dt>
            <dd className="font-medium">{user?.email}</dd>
            <dt className="text-label-secondary">Name</dt>
            <dd className="font-medium">{user?.firstName || user?.lastName ? `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() : '—'}</dd>
          </dl>
        </div>

        <div className={form.panel}>
          <h2 className="text-lg font-semibold text-label-primary mb-4">Wallet</h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <dt className="text-label-secondary">Available</dt>
            <dd className="font-medium">{formatCurrency(wallet?.availableCents ?? 0, wallet?.currency ?? 'GHS')}</dd>
            <dt className="text-label-secondary">Pending</dt>
            <dd className="font-medium">{formatCurrency(wallet?.pendingCents ?? 0, wallet?.currency ?? 'GHS')}</dd>
            <dt className="text-label-secondary">Currency</dt>
            <dd className="font-medium">{wallet?.currency ?? 'GHS'}</dd>
          </dl>
        </div>

        <div className="flex gap-3 flex-wrap">
          <Link
            href={`/admin/wallet/credit?userId=${userId}`}
            className="inline-flex px-4 py-2 rounded-ios-lg bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 hover:bg-emerald-500/30 font-semibold transition-colors"
          >
            Credit (Top-up)
          </Link>
          <Link
            href={`/admin/wallet/debit?userId=${userId}`}
            className="inline-flex px-4 py-2 rounded-ios-lg bg-amber-500/20 text-amber-200 border border-amber-500/30 hover:bg-amber-500/30 font-semibold transition-colors"
          >
            Debit (Deduct)
          </Link>
          <Link href="/admin/users" className="inline-flex px-4 py-2 rounded-ios-lg bg-white/10 text-label-primary border border-white/15 hover:bg-white/15 font-medium transition-colors">
            Back to Users
          </Link>
        </div>
      </PullToRefresh>
    </Layout>
  );
}
