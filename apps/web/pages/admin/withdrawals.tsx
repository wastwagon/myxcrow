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
          <span className="px-3 py-1 text-xs font-medium rounded-full bg-yellow-100 text-yellow-800 border border-yellow-200 flex items-center gap-1">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        );
      case 'SUCCEEDED':
        return (
          <span className="px-3 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800 border border-green-200 flex items-center gap-1">
            <CheckCircle className="w-3 h-3" />
            Approved
          </span>
        );
      case 'FAILED':
        return (
          <span className="px-3 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800 border border-red-200 flex items-center gap-1">
            <XCircle className="w-3 h-3" />
            Denied
          </span>
        );
      default:
        return (
          <span className="px-3 py-1 text-xs font-medium rounded-full bg-gray-100 text-gray-800 border border-gray-200">
            {status}
          </span>
        );
    }
  };

  const pendingWithdrawals = withdrawalsData?.withdrawals?.filter((w) => w.status === 'REQUESTED') || [];

  return (
    <Layout>
      <div className="space-y-6">
        <PageHeader
          title="Withdrawal Management"
          subtitle="Approve or deny withdrawal requests"
          icon={<ArrowUpCircle className="w-6 h-6" />}
          action={
            pendingWithdrawals.length > 0 ? (
              <div className="px-4 py-2 bg-amber-100 text-amber-800 rounded-lg border border-amber-200">
                <p className="text-sm font-semibold">
                  {pendingWithdrawals.length} pending withdrawal{pendingWithdrawals.length !== 1 ? 's' : ''}
                </p>
              </div>
            ) : undefined
          }
        />

        {/* Filters */}
        <div className="bg-white rounded-xl shadow-lg p-6">
          <div className="flex items-center gap-4">
            <Filter className="w-5 h-5 text-gray-400" />
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="REQUESTED">Pending</option>
              <option value="SUCCEEDED">Approved</option>
              <option value="FAILED">Denied</option>
            </select>
          </div>
        </div>

        {/* Withdrawals Table */}
        <div className="bg-white rounded-xl shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Method
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Requested
                  </th>
                  <th className="px-6 py-4 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {isLoading ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                      </div>
                    </td>
                  </tr>
                ) : withdrawalsData?.withdrawals && withdrawalsData.withdrawals.length > 0 ? (
                  withdrawalsData.withdrawals.map((withdrawal) => (
                    <tr key={withdrawal.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                            {withdrawal.wallet.user.email[0].toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-gray-900">{withdrawal.wallet.user.email}</p>
                            <p className="text-sm text-gray-500">ID: {withdrawal.wallet.user.id.slice(0, 8)}...</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="font-semibold text-gray-900">
                          {formatCurrency(withdrawal.amountCents, 'GHS')}
                        </p>
                        {withdrawal.feeCents > 0 && (
                          <p className="text-xs text-gray-500">Fee: {formatCurrency(withdrawal.feeCents, 'GHS')}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <p className="text-sm text-gray-900">{withdrawal.methodType}</p>
                        {withdrawal.methodDetails?.accountNumber && (
                          <p className="text-xs text-gray-500">***{withdrawal.methodDetails.accountNumber.slice(-4)}</p>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(withdrawal.status)}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                        {formatDate(withdrawal.createdAt)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {withdrawal.status === 'REQUESTED' ? (
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleProcess(withdrawal, 'approve')}
                              className="px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleProcess(withdrawal, 'deny')}
                              className="px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium transition-colors"
                            >
                              Deny
                            </button>
                          </div>
                        ) : (
                          <span className="text-sm text-gray-400">Processed</span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="px-6 py-12 text-center text-gray-500">
                      <ArrowUpCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                      <p>No withdrawals found</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {withdrawalsData && (
            <div className="px-6 py-4 bg-gray-50 border-t border-gray-200">
              <p className="text-sm text-gray-600">
                Showing <span className="font-medium">{withdrawalsData.withdrawals.length}</span> of{' '}
                <span className="font-medium">{withdrawalsData.total}</span> withdrawals
              </p>
            </div>
          )}
        </div>

        {/* Process Modal */}
        {showProcessModal && selectedWithdrawal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-4">
                {processAction === 'approve' ? 'Approve Withdrawal' : 'Deny Withdrawal'}
              </h3>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">User Email</p>
                  <p className="font-medium text-gray-900">{selectedWithdrawal.wallet.user.email}</p>
                  <p className="text-xs text-gray-500 mt-1">ID: {selectedWithdrawal.wallet.user.id.slice(0, 8)}...</p>
                </div>
                <div className="p-4 bg-gray-50 rounded-lg">
                  <p className="text-sm text-gray-600 mb-1">Amount</p>
                  <p className="font-bold text-lg text-gray-900">
                    {formatCurrency(selectedWithdrawal.amountCents, 'GHS')}
                  </p>
                </div>
                {processAction === 'deny' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason <span className="text-red-600">*</span>
                    </label>
                    <textarea
                      value={reason}
                      onChange={(e) => setReason(e.target.value)}
                      rows={3}
                      placeholder="Enter reason for denial..."
                      className="w-full px-4 py-2 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-transparent"
                      required
                    />
                  </div>
                )}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={() => {
                      setShowProcessModal(false);
                      setSelectedWithdrawal(null);
                      setReason('');
                    }}
                    className="flex-1 px-4 py-2 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmProcess}
                    disabled={processMutation.isPending || (processAction === 'deny' && !reason)}
                    className={`flex-1 px-4 py-2 rounded-lg font-medium text-white transition-colors ${
                      processAction === 'approve'
                        ? 'bg-green-600 hover:bg-green-700'
                        : 'bg-red-600 hover:bg-red-700'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {processMutation.isPending ? 'Processing...' : processAction === 'approve' ? 'Approve' : 'Deny'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

