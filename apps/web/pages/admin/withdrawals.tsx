import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { isAuthenticated, isAdmin } from '@/lib/auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  ArrowUpCircle,
  CheckCircle,
  XCircle,
  Clock,
  Search,
  Filter,
  User,
  DollarSign,
  AlertCircle,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import PageHeader from '@/components/PageHeader';
import { AdminAvatar } from '@/components/admin/AdminIconBadge';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { useIsMobileNav } from '@/lib/hooks/useMediaQuery';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';

interface Withdrawal {
  id: string;
  amountCents: number;
  feeCents: number;
  currency: string;
  status: string;
  methodType: string;
  methodDetails: any;
  createdAt: string;
  processedAt?: string;
  failureReason?: string;
  wallet: {
    user: {
      id: string;
      email: string;
      firstName?: string;
      lastName?: string;
    };
  };
}

export default function AdminWithdrawalsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isMobile = useIsMobileNav();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [processAction, setProcessAction] = useState<'approve' | 'deny' | null>(null);
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!isAuthenticated() || !isAdmin()) {
      router.push('/login');
    }
  }, [router]);

  const { data: withdrawalsData, isLoading } = useQuery<{
    withdrawals: Withdrawal[];
    total: number;
  }>({
    queryKey: ['admin-withdrawals', statusFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      params.append('limit', '50');
      const response = await apiClient.get(`/wallet/admin/withdrawals?${params.toString()}`);
      return response.data;
    },
  });

  const processMutation = useMutation({
    mutationFn: async ({ id, succeeded, reason }: { id: string; succeeded: boolean; reason?: string }) => {
      return apiClient.put(`/wallet/withdraw/${id}/process`, { succeeded, reason });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-withdrawals'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      toast.success(processAction === 'approve' ? 'Withdrawal approved' : 'Withdrawal denied');
      setShowProcessModal(false);
      setSelectedWithdrawal(null);
      setReason('');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to process withdrawal');
    },
  });

  const handleProcess = (withdrawal: Withdrawal, action: 'approve' | 'deny') => {
    setSelectedWithdrawal(withdrawal);
    setProcessAction(action);
    setShowProcessModal(true);
    setReason('');
  };

  const confirmProcess = () => {
    if (!selectedWithdrawal) return;
    processMutation.mutate({
      id: selectedWithdrawal.id,
      succeeded: processAction === 'approve',
      reason: processAction === 'deny' ? reason : undefined,
    });
  };

  if (!isAuthenticated() || !isAdmin()) {
    return null;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'REQUESTED':
        return (
          <span className="px-3 py-1 text-xs font-medium rounded-full bg-amber-500/20 text-amber-200 border border-amber-500/30 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case 'SUCCEEDED':
        return (
          <span className="px-3 py-1 text-xs font-medium rounded-full bg-emerald-500/20 text-emerald-200 border border-emerald-500/30 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Approved
          </span>
        );
      case 'FAILED':
        return (
          <span className="px-3 py-1 text-xs font-medium rounded-full bg-red-500/20 text-red-200 border border-red-500/30 flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            Denied
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 text-xs font-medium rounded-full bg-white/10 text-white/80 border border-white/20">
            {status}
          </span>
        );
    }
  };

  const refreshWithdrawals = async () => {
    await queryClient.invalidateQueries({ queryKey: ['admin-withdrawals'] });
  };

  const pendingWithdrawals = withdrawalsData?.withdrawals?.filter((w) => w.status === 'REQUESTED') || [];

  return (
    <Layout>
      <PullToRefresh onRefresh={refreshWithdrawals} disabled={!isMobile} className="space-y-6">
        <PageHeader
          title="Withdrawal Management"
          subtitle="Approve or deny withdrawal requests"
          icon={<ArrowUpCircle className="w-6 h-6" />}
          action={
            pendingWithdrawals.length > 0 ? (
              <div className="px-4 py-2 bg-amber-500/20 text-amber-200 rounded-ios-lg border border-amber-500/30">
                <p className="text-sm font-semibold">
                  {pendingWithdrawals.length} pending withdrawal{pendingWithdrawals.length !== 1 ? 's' : ''}
                </p>
              </div>
            ) : undefined
          }
        />

        {/* Filters */}
        <div className="rounded-ios-xl border border-white/10 bg-white/[0.07] backdrop-blur-sm shadow-ios-card p-6">
          <div className="flex items-center gap-4">
            <Filter className="w-5 h-5 text-white/50" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border-2 border-white/20 rounded-lg focus:ring-2 focus:ring-brand-gold focus:border-brand-gold/50 outline-none"
            >
              <option value="all">All Status</option>
              <option value="REQUESTED">Pending</option>
              <option value="SUCCEEDED">Approved</option>
              <option value="FAILED">Denied</option>
            </select>
          </div>
        </div>

        {/* Withdrawals Table */}
        <div className="rounded-ios-xl border border-white/10 bg-white/[0.07] backdrop-blur-sm shadow-ios-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-white/5 border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/80 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/80 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/80 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/80 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/80 uppercase tracking-wider">
                    Requested
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-white/80 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-gold"></div>
                      </div>
                    </td>
                  </tr>
                ) : withdrawalsData?.withdrawals && withdrawalsData.withdrawals.length > 0 ? (
                  withdrawalsData.withdrawals.map((withdrawal) => (
                    <tr key={withdrawal.id} className="hover:bg-white/5 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <AdminAvatar label={withdrawal.wallet.user.email} variant="maroon" />
                          <div>
                            <p className="font-medium text-white">{withdrawal.wallet.user.email}</p>
                            <p className="text-sm text-white/55">ID: {withdrawal.wallet.user.id.slice(0, 8)}...</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="font-semibold text-white">
                          {formatCurrency(withdrawal.amountCents, 'GHS')}
                        </p>
                        {withdrawal.feeCents > 0 && (
                          <p className="text-xs text-white/55">Fee: {formatCurrency(withdrawal.feeCents, 'GHS')}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-white">{withdrawal.methodType}</p>
                        {withdrawal.methodDetails?.accountNumber && (
                          <p className="text-xs text-white/55">***{withdrawal.methodDetails.accountNumber.slice(-4)}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(withdrawal.status)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-white/70">
                        {formatDate(withdrawal.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {withdrawal.status === 'REQUESTED' ? (
                          <div className="flex items-center gap-2">
                            <Button size="sm" variant="tinted" onClick={() => handleProcess(withdrawal, 'approve')}>
                              Approve
                            </Button>
                            <Button size="sm" variant="destructive" onClick={() => handleProcess(withdrawal, 'deny')}>
                              Deny
                            </Button>
                          </div>
                        ) : (
                          <span className="text-sm text-white/50">Processed</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-white/55">
                      <ArrowUpCircle className="w-12 h-12 mx-auto mb-3 text-white/50" />
                      <p>No withdrawals found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {withdrawalsData && (
            <div className="px-6 py-4 bg-white/5 border-t border-white/10">
              <p className="text-sm text-white/70">
                Showing <span className="font-medium">{withdrawalsData.withdrawals.length}</span> of{' '}
                <span className="font-medium">{withdrawalsData.total}</span> withdrawals
              </p>
            </div>
          )}
        </div>

        <Sheet
          open={showProcessModal && !!selectedWithdrawal}
          onClose={() => {
            setShowProcessModal(false);
            setSelectedWithdrawal(null);
            setReason('');
          }}
          title={processAction === 'approve' ? 'Approve withdrawal' : 'Deny withdrawal'}
          footer={
            <div className="flex gap-3 pb-2">
              <Button
                type="button"
                variant="secondary"
                fullWidth
                onClick={() => {
                  setShowProcessModal(false);
                  setSelectedWithdrawal(null);
                  setReason('');
                }}
              >
                Cancel
              </Button>
              <Button
                type="button"
                variant={processAction === 'approve' ? 'filled' : 'destructive'}
                fullWidth
                loading={processMutation.isPending}
                disabled={processAction === 'deny' && !reason}
                onClick={confirmProcess}
              >
                {processAction === 'approve' ? 'Approve' : 'Deny'}
              </Button>
            </div>
          }
        >
          {selectedWithdrawal && (
            <div className="space-y-4 pb-2">
              <div className="p-4 rounded-ios-lg bg-white/5 border border-white/10">
                <p className="text-ios-footnote text-label-secondary mb-1">User</p>
                <p className="font-medium text-label-primary">{selectedWithdrawal.wallet.user.email}</p>
                <p className="text-ios-caption text-label-tertiary mt-1">
                  ID: {selectedWithdrawal.wallet.user.id.slice(0, 8)}…
                </p>
              </div>
              <div className="p-4 rounded-ios-lg bg-white/5 border border-white/10">
                <p className="text-ios-footnote text-label-secondary mb-1">Amount</p>
                <p className="text-ios-title-2 font-bold text-label-primary">
                  {formatCurrency(selectedWithdrawal.amountCents, 'GHS')}
                </p>
              </div>
              {processAction === 'deny' && (
                <div>
                  <label className="block text-ios-footnote font-medium text-label-secondary mb-2">
                    Reason <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    placeholder="Enter reason for denial…"
                    className="w-full px-4 py-3 border border-white/20 rounded-ios-lg bg-white/5 text-label-primary placeholder:text-label-tertiary focus:ring-2 focus:ring-red-500/40 focus:border-red-500/40 outline-none resize-none"
                  />
                </div>
              )}
            </div>
          )}
        </Sheet>
      </PullToRefresh>
    </Layout>
  );
}

