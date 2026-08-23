import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { AdminGate } from '@/components/admin/AdminGate';
import { isAuthenticated, isAdmin } from '@/lib/auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { formatCurrency, formatDate } from '@/lib/utils';
import { ArrowUpCircle, Filter, Eye } from 'lucide-react';
import { buildWithdrawalReceipt } from '@/lib/receipt-builders';
import { PrintReceiptButton } from '@/components/receipts/PrintReceiptButton';
import { toast } from 'react-hot-toast';
import { AdminAvatar } from '@/components/admin/AdminIconBadge';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { useIsMobileNav } from '@/lib/hooks/useMediaQuery';
import { Sheet } from '@/components/ui/Sheet';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Field } from '@/components/ui/Field';
import { Modal } from '@/components/ui/Modal';
import { Badge } from '@/components/ui/Badge';
import {
  TableShell,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableTh,
  TableTd,
  TableEmpty,
} from '@/components/ui/Table';
import {
  WithdrawalPayoutDetailsView,
  type WithdrawalRecord,
} from '@/components/admin/WithdrawalPayoutDetails';
import { formatWithdrawalMethodLabel } from '@/lib/withdrawal-payout';
import { StatusBadge } from '@/components/StatusBadge';
import { EmptyState } from '@/components/ui/EmptyState';
import { LightShell } from '@/components/dashboard/LightShell';
import { dash } from '@/components/dashboard/lightClasses';
import { MetricCard } from '@/components/ui/MetricCard';

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

  const refreshWithdrawals = async () => {
    await queryClient.invalidateQueries({ queryKey: ['admin-withdrawals'] });
  };

  const pendingWithdrawals = withdrawalsData?.withdrawals?.filter((w) => w.status === 'REQUESTED') || [];

  return (
    <AdminGate title="Withdrawals">
      <PullToRefresh onRefresh={refreshWithdrawals} disabled={!isMobile}>
        <LightShell>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <p className={dash.subtitle}>
              Review payout details and approve or deny requests
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {pendingWithdrawals.length > 0 && (
                <Badge tone="light" color="warning" variant="subtle">
                  {pendingWithdrawals.length} pending
                </Badge>
              )}
              <ButtonLink href="/admin" variant="outline" size="sm">
                Back to admin
              </ButtonLink>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <MetricCard
              tone="light"
              label="Pending"
              value={pendingWithdrawals.length}
              hint="Awaiting approval"
              icon={<ArrowUpCircle className="w-5 h-5" />}
              accent="amber"
            />
            <MetricCard
              tone="light"
              label="In view"
              value={withdrawalsData?.withdrawals.length ?? 0}
              hint={`of ${withdrawalsData?.total ?? 0} total`}
              icon={<Filter className="w-5 h-5" />}
              accent="maroon"
              loading={isLoading}
            />
            <MetricCard
              tone="light"
              label="Filter"
              value={
                statusFilter === 'all'
                  ? 'All'
                  : statusFilter === 'REQUESTED'
                    ? 'Pending'
                    : statusFilter === 'SUCCEEDED'
                      ? 'Approved'
                      : 'Denied'
              }
              hint="Current status filter"
              icon={<Eye className="w-5 h-5" />}
              accent="gold"
              className="col-span-2 sm:col-span-1"
            />
          </div>

          <TableShell
            tone="light"
            toolbar={
              <div className="flex items-center gap-3">
                <Filter className="w-4 h-4 text-brand-maroon shrink-0" />
                <Select
                  tone="light"
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="max-w-xs"
                >
                  <option value="all">All Status</option>
                  <option value="REQUESTED">Pending</option>
                  <option value="SUCCEEDED">Approved</option>
                  <option value="FAILED">Denied</option>
                </Select>
              </div>
            }
            footer={
              withdrawalsData ? (
                <p>
                  Showing{' '}
                  <span className="font-semibold text-gray-900">
                    {withdrawalsData.withdrawals.length}
                  </span>{' '}
                  of{' '}
                  <span className="font-semibold text-gray-900">{withdrawalsData.total}</span>{' '}
                  withdrawals
                </p>
              ) : undefined
            }
          >
            <Table>
              <TableHead>
                <tr>
                  <TableTh>User</TableTh>
                  <TableTh numeric>Amount</TableTh>
                  <TableTh>Payout</TableTh>
                  <TableTh>Status</TableTh>
                  <TableTh>Requested</TableTh>
                  <TableTh>Actions</TableTh>
                </tr>
              </TableHead>
              <TableBody>
                {isLoading ? (
                  <TableEmpty colSpan={6}>
                    <div className="flex justify-center py-4">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-maroon" />
                    </div>
                  </TableEmpty>
                ) : withdrawalsData?.withdrawals?.length ? (
                  withdrawalsData.withdrawals.map((withdrawal) => (
                    <TableRow key={withdrawal.id}>
                      <TableTd>
                        <div className="flex items-center gap-3 min-w-[180px]">
                          <AdminAvatar
                            label={withdrawal.wallet?.user?.email || '?'}
                            variant="maroon"
                          />
                          <div className="min-w-0">
                            <p className="font-medium text-gray-900 truncate">
                              {withdrawal.wallet?.user?.email}
                            </p>
                            {withdrawal.wallet?.user?.phone && (
                              <p className="text-xs text-gray-500">{withdrawal.wallet.user.phone}</p>
                            )}
                          </div>
                        </div>
                      </TableTd>
                      <TableTd numeric>
                        <p className="font-semibold text-gray-900 whitespace-nowrap">
                          {formatCurrency(withdrawal.amountCents, withdrawal.currency || 'GHS')}
                        </p>
                        {withdrawal.feeCents > 0 && (
                          <p className="text-xs text-gray-500">
                            Fee: {formatCurrency(withdrawal.feeCents, withdrawal.currency || 'GHS')}
                          </p>
                        )}
                      </TableTd>
                      <TableTd>
                        <p className="text-sm text-gray-900">
                          {withdrawal.methodLabel ||
                            formatWithdrawalMethodLabel(withdrawal.methodType)}
                        </p>
                        <p className="text-xs text-gray-500 truncate max-w-[200px]">
                          {withdrawal.payoutSummary || '—'}
                        </p>
                      </TableTd>
                      <TableTd>
                        <StatusBadge status={withdrawal.status} onDark={false} />
                      </TableTd>
                      <TableTd muted className="whitespace-nowrap">
                        {formatDate(withdrawal.createdAt)}
                      </TableTd>
                      <TableTd>
                        <div className="flex items-center gap-2 flex-wrap">
                          <button
                            type="button"
                            onClick={() => openDetails(withdrawal)}
                            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-[16px] text-brand-maroon hover:bg-brand-maroon/10"
                            title="View payout details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <PrintReceiptButton
                            receipt={buildWithdrawalReceipt(withdrawal, undefined, {
                              isAdminCopy: true,
                              showSensitive: true,
                            })}
                            iconOnly
                            variant="outline"
                            size="sm"
                            label="Print receipt"
                          />
                          {withdrawal.status === 'REQUESTED' && (
                            <>
                              <Button
                                size="sm"
                                variant="maroon"
                                onClick={() => handleProcess(withdrawal, 'approve')}
                              >
                                Approve
                              </Button>
                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => handleProcess(withdrawal, 'deny')}
                              >
                                Deny
                              </Button>
                            </>
                          )}
                        </div>
                      </TableTd>
                    </TableRow>
                  ))
                ) : (
                  <TableEmpty colSpan={6}>
                    <EmptyState
                      tone="light"
                      icon={<ArrowUpCircle className="w-6 h-6" />}
                      title="No withdrawals found"
                      description="When users request payouts they appear here."
                      action={{ href: '/admin', label: 'Back to queue', variant: 'maroon' }}
                      className="py-6"
                    />
                  </TableEmpty>
                )}
              </TableBody>
            </Table>
          </TableShell>

          <Sheet
            open={detailOpen && !!selectedWithdrawal}
            onClose={() => {
              setDetailOpen(false);
              setSelectedWithdrawal(null);
            }}
            title="Withdrawal details"
            tone="light"
            footer={
              selectedWithdrawal ? (
                <div className="flex flex-col gap-3 pb-2">
                  <PrintReceiptButton
                    receipt={buildWithdrawalReceipt(selectedWithdrawal, undefined, {
                      isAdminCopy: true,
                      showSensitive: true,
                    })}
                    fullWidth
                    variant="outline"
                  />
                  {selectedWithdrawal.status === 'REQUESTED' ? (
                    <div className="flex gap-3">
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
                        variant="maroon"
                        fullWidth
                        onClick={() => {
                          setDetailOpen(false);
                          handleProcess(selectedWithdrawal, 'approve');
                        }}
                      >
                        Approve
                      </Button>
                    </div>
                  ) : null}
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

          <Modal
            open={showProcessModal && !!selectedWithdrawal}
            onClose={() => {
              setShowProcessModal(false);
              setReason('');
            }}
            title={processAction === 'approve' ? 'Approve withdrawal' : 'Deny withdrawal'}
            tone="light"
            footer={
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setShowProcessModal(false);
                    setReason('');
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="button"
                  variant={processAction === 'approve' ? 'maroon' : 'destructive'}
                  loading={processMutation.isPending}
                  disabled={processAction === 'deny' && !reason.trim()}
                  onClick={confirmProcess}
                >
                  {processAction === 'approve' ? 'Approve' : 'Deny'}
                </Button>
              </>
            }
          >
            {selectedWithdrawal && (
              <div className="space-y-4">
                <WithdrawalPayoutDetailsView withdrawal={selectedWithdrawal} showSensitive />
                {processAction === 'deny' && (
                  <Field tone="light" label="Reason" required>
                    <Textarea
                      tone="light"
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={3}
                      placeholder="Enter reason for denial…"
                    />
                  </Field>
                )}
              </div>
            )}
          </Modal>
        </LightShell>
      </PullToRefresh>
    </AdminGate>
  );
}
