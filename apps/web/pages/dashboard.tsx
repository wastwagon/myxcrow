import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { isAuthenticated, getUser, isAdmin } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import {
  FileText,
  DollarSign,
  Clock,
  CheckCircle,
  TrendingUp,
  ArrowRight,
  Plus,
  Wallet,
  Activity,
} from 'lucide-react';
import { formatCurrency, formatDate } from '@/lib/utils';
import { extractArrayData } from '@/lib/api-helpers';
import { ESCROW_STATUS_COLORS, ACTIVE_ESCROW_STATUSES, COMPLETED_ESCROW_STATUSES, formatStatus } from '@/lib/constants';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';

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
      // Redirect admins to admin dashboard instead of regular dashboard
      if (isAdmin()) {
        router.push('/admin');
        return;
      }
      
      const user = getUser();
      if (user) {
        // Use firstName if available, otherwise use email prefix
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

  const { data: escrowsData, isLoading: escrowsLoading } = useQuery<{ data?: Escrow[]; escrows?: Escrow[]; total?: number } | Escrow[]>({
    queryKey: ['escrows'],
    queryFn: async () => {
      const response = await apiClient.get('/escrows');
      return response.data;
    },
    enabled: mounted && isAuthenticated(),
  });

  // Extract escrows array from response (handle both formats)
  const escrows: Escrow[] = Array.isArray(escrowsData) 
    ? escrowsData 
    : (escrowsData?.data || escrowsData?.escrows || []);

  // Render consistent placeholder until mounted to avoid hydration mismatch
  if (!mounted || !isAuthenticated()) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600" />
      </div>
    );
  }

  const statusColors: Record<string, string> = {
    AWAITING_FUNDING: 'bg-yellow-100 text-yellow-800 border-yellow-200',
    FUNDED: 'bg-blue-100 text-blue-800 border-blue-200',
    AWAITING_SHIPMENT: 'bg-purple-100 text-purple-800 border-purple-200',
    SHIPPED: 'bg-indigo-100 text-indigo-800 border-indigo-200',
    DELIVERED: 'bg-green-100 text-green-800 border-green-200',
    RELEASED: 'bg-gray-100 text-gray-800 border-gray-200',
    DISPUTED: 'bg-red-100 text-red-800 border-red-200',
    CANCELLED: 'bg-gray-100 text-gray-800 border-gray-200',
  };

  const activeEscrows = escrows?.filter((e) => !['RELEASED', 'CANCELLED'].includes(e.status)) || [];
  const recentEscrows = escrows?.slice(0, 5) || [];

  return (
    <Layout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <PageHeader
          title={`Welcome Back${userName ? `, ${userName}` : ''}!`}
          subtitle="Here's your account overview"
          icon={<FileText className="w-6 h-6" />}
        />

        {/* Wallet Summary Cards */}
        <div className="grid md:grid-cols-3 gap-6">
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <Wallet className="w-8 h-8 opacity-90" />
              <TrendingUp className="w-5 h-5 opacity-75" />
            </div>
            <h3 className="text-sm font-medium opacity-90 mb-1">Available Balance</h3>
            {walletLoading ? (
              <div className="h-8 bg-green-400/30 animate-pulse rounded" />
            ) : (
              <p className="text-3xl font-bold">
                {wallet ? formatCurrency(wallet.availableCents, 'GHS') : '--'}
              </p>
            )}
            <p className="text-sm opacity-75 mt-2">Ready to use</p>
          </div>

          <div className="bg-gradient-to-br from-yellow-500 to-orange-500 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <Clock className="w-8 h-8 opacity-90" />
              <Activity className="w-5 h-5 opacity-75" />
            </div>
            <h3 className="text-sm font-medium opacity-90 mb-1">Pending Balance</h3>
            {walletLoading ? (
              <div className="h-8 bg-yellow-400/30 animate-pulse rounded" />
            ) : (
              <p className="text-3xl font-bold">
                {wallet ? formatCurrency(wallet.pendingCents, 'GHS') : '--'}
              </p>
            )}
            <p className="text-sm opacity-75 mt-2">In escrow or pending</p>
          </div>

          <div className="bg-gradient-to-br from-blue-500 to-indigo-600 rounded-xl shadow-lg p-6 text-white">
            <div className="flex items-center justify-between mb-4">
              <FileText className="w-8 h-8 opacity-90" />
              <CheckCircle className="w-5 h-5 opacity-75" />
            </div>
            <h3 className="text-sm font-medium opacity-90 mb-1">Active Escrows</h3>
            {escrowsLoading ? (
              <div className="h-8 bg-blue-400/30 animate-pulse rounded" />
            ) : (
              <p className="text-3xl font-bold">{activeEscrows.length}</p>
            )}
            <p className="text-sm opacity-75 mt-2">In progress</p>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Quick Actions</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link
              href="/escrows/new"
              className="flex items-center gap-4 p-4 border-2 border-blue-200 rounded-lg hover:border-blue-400 hover:bg-blue-50 transition-all group"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <Plus className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Create Escrow</h3>
                <p className="text-sm text-gray-600">Start a new transaction</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 transition-colors" />
            </Link>

            <Link
              href="/wallet"
              className="flex items-center gap-4 p-4 border-2 border-green-200 rounded-lg hover:border-green-400 hover:bg-green-50 transition-all group"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <Wallet className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">Manage Wallet</h3>
                <p className="text-sm text-gray-600">View transactions</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-green-600 transition-colors" />
            </Link>

            <Link
              href="/escrows"
              className="flex items-center gap-4 p-4 border-2 border-purple-200 rounded-lg hover:border-purple-400 hover:bg-purple-50 transition-all group"
            >
              <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
                <FileText className="w-6 h-6 text-white" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900">View All Escrows</h3>
                <p className="text-sm text-gray-600">See all transactions</p>
              </div>
              <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-purple-600 transition-colors" />
            </Link>
          </div>
        </div>

        {/* Recent Escrows */}
        <div className="bg-white rounded-xl shadow-lg">
          <div className="p-6 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold text-gray-900">Recent Escrows</h2>
              <Link
                href="/escrows"
                className="text-blue-600 hover:text-blue-700 text-sm font-medium flex items-center gap-1"
              >
                View all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
          <div className="p-6">
            {escrowsLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-gray-200 animate-pulse rounded-lg" />
                ))}
              </div>
            ) : recentEscrows.length > 0 ? (
              <div className="space-y-4">
                {recentEscrows.map((escrow) => (
                  <Link
                    key={escrow.id}
                    href={`/escrows/${escrow.id}`}
                    className="block p-5 border-2 border-gray-200 rounded-xl hover:border-blue-300 hover:bg-blue-50 transition-all group"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="font-semibold text-gray-900 group-hover:text-blue-600">
                            {escrow.description || 'Escrow Agreement'}
                          </h3>
                          <span
                            className={`px-3 py-1 text-xs font-medium rounded-full border ${
                              ESCROW_STATUS_COLORS[escrow.status] || 'bg-gray-100 text-gray-800 border-gray-200'
                            }`}
                          >
                            {formatStatus(escrow.status)}
                          </span>
                        </div>
                        <div className="flex items-center gap-4 text-sm text-gray-600">
                          <span className="font-medium text-gray-900">
                            {formatCurrency(escrow.amountCents, 'GHS')}
                          </span>
                          <span>•</span>
                          <span>{formatDate(escrow.createdAt)}</span>
                        </div>
                      </div>
                      <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-blue-600 group-hover:translate-x-1 transition-all" />
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="text-center py-12 text-gray-500">
                <FileText className="w-16 h-16 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium mb-2">No escrows yet</p>
                <p className="text-sm mb-6">Get started by creating your first escrow agreement</p>
                <Link
                  href="/escrows/new"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 font-medium shadow-lg transition-all"
                >
                  <Plus className="w-5 h-5" />
                  Create Your First Escrow
                </Link>
              </div>
            )}
          </div>
        </div>

        {/* Activity Summary */}
        {activeEscrows.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-600">Awaiting Action</h3>
                <Clock className="w-5 h-5 text-blue-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {escrows?.filter((e) => ['AWAITING_FUNDING', 'AWAITING_SHIPMENT'].includes(e.status)).length || 0}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-600">In Progress</h3>
                <Activity className="w-5 h-5 text-green-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {escrows?.filter((e) => ['FUNDED', 'SHIPPED', 'IN_TRANSIT', 'DELIVERED'].includes(e.status)).length || 0}
              </p>
            </div>

            <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-purple-500">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-600">Completed</h3>
                <CheckCircle className="w-5 h-5 text-purple-600" />
              </div>
              <p className="text-2xl font-bold text-gray-900">
                {escrows?.filter((e) => COMPLETED_ESCROW_STATUSES.includes(e.status)).length || 0}
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
