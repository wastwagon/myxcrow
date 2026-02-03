import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { isAuthenticated, isAdmin } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { formatCurrency, formatDate } from '@/lib/utils';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';

export default function AdminViewWalletPage() {
  const router = useRouter();
  const { userId } = router.query;

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
        <div className="flex items-center justify-center min-h-[200px]">
          <p className="text-gray-600">Loading wallet…</p>
        </div>
      </Layout>
    );
  }

  if (error || !data) {
    return (
      <Layout>
        <div className="space-y-4">
          <button onClick={() => router.back()} className="text-blue-600 hover:underline">
            ← Back
          </button>
          <p className="text-red-600">Failed to load wallet.</p>
        </div>
      </Layout>
    );
  }

  const { wallet, user } = data;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="text-blue-600 hover:underline">
            ← Back
          </button>
        </div>
        <PageHeader
          title="View User Wallet"
          subtitle={user?.email}
          icon={<span className="text-2xl">👤</span>}
          gradient="blue"
        />

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">User</h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <dt className="text-gray-500">Email</dt>
            <dd className="font-medium">{user?.email}</dd>
            <dt className="text-gray-500">Name</dt>
            <dd className="font-medium">{user?.firstName || user?.lastName ? `${user?.firstName ?? ''} ${user?.lastName ?? ''}`.trim() : '—'}</dd>
          </dl>
        </div>

        <div className="bg-white rounded-xl shadow p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Wallet</h2>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
            <dt className="text-gray-500">Available</dt>
            <dd className="font-medium">{formatCurrency(wallet?.availableCents ?? 0, wallet?.currency ?? 'GHS')}</dd>
            <dt className="text-gray-500">Pending</dt>
            <dd className="font-medium">{formatCurrency(wallet?.pendingCents ?? 0, wallet?.currency ?? 'GHS')}</dd>
            <dt className="text-gray-500">Currency</dt>
            <dd className="font-medium">{wallet?.currency ?? 'GHS'}</dd>
          </dl>
        </div>

        <div className="flex gap-3">
          <Link
            href={`/admin/wallet/credit?userId=${userId}`}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
          >
            Credit Wallet
          </Link>
          <Link href="/admin/users" className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
            Back to Users
          </Link>
        </div>
      </div>
    </Layout>
  );
}
