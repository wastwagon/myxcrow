import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { isAuthenticated, isAdmin } from '@/lib/auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { formatCurrency, formatDate } from '@/lib/utils';
import {
  ArrowUpCircle,
  Filter,
  Eye,
} from 'lucide-react';
import { toast } from 'react-hot-toast';
import PageHeader from '@/components/PageHeader';
import { AdminAvatar } from '@/components/admin/AdminIconBadge';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { useIsMobileNav } from '@/lib/hooks/useMediaQuery';
import { admin } from '@/components/admin/adminClasses';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';
import {
  WithdrawalPayoutDetailsView,
  type WithdrawalRecord,
} from '@/components/admin/WithdrawalPayoutDetails';
import { formatWithdrawalMethodLabel } from '@/lib/withdrawal-payout';
import { WithdrawalStatusBadge } from '@/components/StatusBadge';

export default function AdminWithdrawalsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isMobile = useIsMobileNav();
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<WithdrawalRecord | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [processAction, setProcessAction] = useState<'approve' | 'deny' | null>(null);
  const [reason, setReason] = useState('');

  useEffect(() => {
    if (!isAuthenticated() || !isAdmin()) {
      router.push('/login');
    }
  }, [router]);

  const { data: withdrawalsData, isLoading } = useQuery<{
    withdrawals: WithdrawalRecord[];
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
      setDetailOpen(false);
      setSelectedWithdrawal(null);
      setReason('');
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Failed to process withdrawal');
    },
  });

  const openDetails = (withdrawal: WithdrawalRecord) => {
    setSelectedWithdrawal(withdrawal);
    setDetailOpen(true);
  };

  const handleProcess = (withdrawal: WithdrawalRecord, action: 'approve' | 'deny') => {
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

  const refreshWithdrawals = async () => {
    await queryClient.invalidateQueries({ queryKey: ['admin-withdrawals'] });
  };

  const pendingWithdrawals = withdrawalsData?.withdrawals?.filter((w) => w.status === 'REQUESTED') || [];

  return (
    <Layout>
      <PullToRefresh onRefresh={refreshWithdrawals} disabled={!isMobile} className="space-y-5">
        <PageHeader
          title="Withdrawal Management"
          subtitle="Review payout details and approve or deny requests"
          icon={<ArrowUpCircle className="w-6 h-6" />}
          action={
            pendingWithdrawals.length > 0 ? (
              <div className="px-3 py-1.5 bg-amber-500/20 text-amber-200 rounded-ios-lg border border-amber-500/30">
                <p className="text-sm font-semibold">
                  {pendingWithdrawals.length} pending
                </p>
              </div>
            ) : undefined
          }
        />

        <div className={admin.tableWrap}>
          <div className={admin.tableToolbar}>
            <div className="flex items-center gap-3">
              <Filter className="w-4 h-4 text-white/50 shrink-0" />
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className={`${admin.select} max-w-xs`}
              >
                <option value="all">All Status</option>
                <option value="REQUESTED">Pending</option>
                <option value="SUCCEEDED">Approved</option>
                <option value="FAILED">Denied</option>
              </select>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className={admin.tableHead}>
                <tr>
                  <th className={admin.th}>User</th>
                  <th className={admin.th}>Amount</th>
                  <th className={admin.th}>Payout</th>
                  <th className={admin.th}>Status</th>
                  <th className={admin.th}>Requested</th>
                  <th className={admin.th}>Actions</th>
                </tr>
              </thead>
              <tbody className={admin.tbody}>
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className={`${admin.td} text-center py-12`}>
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-gold" />
                      </div>
                    </td>
                  </tr>
                ) : withdrawalsData?.withdrawals?.length ? (
                  withdrawalsData.withdrawals.map((withdrawal) => (
                    <tr key={withdrawal.id} className={admin.trHover}>
                      <td className={admin.td}>
                        <div className="flex items-center gap-3 min-w-[180px]">
                          <AdminAvatar label={withdrawal.wallet?.user?.email || '?'} variant="maroon" />
                          <div className="min-w-0">
                            <p className="font-medium text-white truncate">
                              {withdrawal.wallet?.user?.email}
                            </p>
                            {withdrawal.wallet?.user?.phone && (
                              <p className="text-xs text-white/55">{withdrawal.wallet.user.phone}</p>
                            )}
                          </div>
                        </div>
                      </td>
                      <td className={admin.td}>
                        <p className="font-semibold text-white whitespace-nowrap">
                          {formatCurrency(withdrawal.amountCents, withdrawal.currency || 'GHS')}
                        </p>
                        {withdrawal.feeCents > 0 && (
                          <p className="text-xs text-white/55">
                            Fee: {formatCurrency(withdrawal.feeCents, withdrawal.currency || 'GHS')}
                          </p>
                        )}
                      </td>
                      <td className={admin.td}>
                        <p className="text-sm text-white">
                          {withdrawal.methodLabel || formatWithdrawalMethodLabel(withdrawal.methodType)}
                        </p>
                        <p className="text-xs text-white/55 truncate max-w-[200px]">
                          {withdrawal.payoutSummary || '—'}
                        </p>
                      </td>
                      <td className={admin.td}><WithdrawalStatusBadge status={withdrawal.status} /></td>
                      <td className={`${admin.td} ${admin.tdMuted} whitespace-nowrap`}>
                        {formatDate(withdrawal.createdAt)}
                      </td>
                      <td className={admin.td}>
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => openDetails(withdrawal)}
                            className={`${admin.rowAction} text-brand-gold hover:bg-brand-gold/15`}
                            title="View payout details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {withdrawal.status === 'REQUESTED' && (
                            <>
                              <Button size="sm" variant="tinted" onClick={() => handleProcess(withdrawal, 'approve')}>
                                Approve
                              </Button>
                              <Button size="sm" variant="destructive" onClick={() => handleProcess(withdrawal, 'deny')}>
                                Deny
                              </Button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className={`${admin.td} text-center py-12 text-white/55`}>
                      <ArrowUpCircle className="w-12 h-12 mx-auto mb-3 text-white/50" />
                      <p>No withdrawals found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {withdrawalsData && (
            <div className={admin.footerBar}>
              <p>
                Showing <span className="font-medium text-white">{withdrawalsData.withdrawals.length}</span> of{' '}
                <span className="font-medium text-white">{withdrawalsData.total}</span> withdrawals
              </p>
            </div>
          )}
        </div>

        <Sheet
          open={detailOpen && !!selectedWithdrawal}
          onClose={() => {
            setDetailOpen(false);
            setSelectedWithdrawal(null);
          }}
          title="Withdrawal details"
          footer={
            selectedWithdrawal?.status === 'REQUESTED' ? (
              <div className="flex gap-3 pb-2">
                <Button
                  type="button"
                  variant="destructive"
                  fullWidth
                  onClick={() => {
                    setDetailOpen(false);
                    handleProcess(selectedWithdrawal, 'deny');
                  }}
                >
                  Deny
                </Button>
                <Button
                  type="button"
                  variant="filled"
                  fullWidth
                  onClick={() => {
                    setDetailOpen(false);
                    handleProcess(selectedWithdrawal, 'approve');
                  }}
                >
                  Approve
                </Button>
              </div>
            ) : undefined
          }
        >
          {selectedWithdrawal && (
            <div className="pb-2">
              <WithdrawalPayoutDetailsView withdrawal={selectedWithdrawal} showSensitive />
            </div>
          )}
        </Sheet>

        <Sheet
          open={showProcessModal && !!selectedWithdrawal}
          onClose={() => {
            setShowProcessModal(false);
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
                disabled={processAction === 'deny' && !reason.trim()}
                onClick={confirmProcess}
              >
                {processAction === 'approve' ? 'Approve' : 'Deny'}
              </Button>
            </div>
          }
        >
          {selectedWithdrawal && (
            <div className="space-y-4 pb-2">
              <WithdrawalPayoutDetailsView withdrawal={selectedWithdrawal} showSensitive />
              {processAction === 'deny' && (
                <div>
                  <label className="block text-sm font-medium text-white/70 mb-2">
                    Reason <span className="text-red-400">*</span>
                  </label>
                  <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    rows={3}
                    placeholder="Enter reason for denial…"
                    className={`${admin.input} resize-none`}
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
