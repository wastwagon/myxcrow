import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { formatCurrency, formatDate } from '@/lib/utils';
import { CheckCircle, Clock, DollarSign, Loader2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getUser } from '@/lib/auth';

interface Milestone {
  id: string;
  name: string;
  description?: string;
  amountCents: number;
  status: 'pending' | 'completed' | 'released';
  completedAt?: string;
  releasedAt?: string;
}

interface MilestoneManagementProps {
  escrowId: string;
  buyerId: string;
  sellerId: string;
}

export default function MilestoneManagement({ escrowId, buyerId, sellerId }: MilestoneManagementProps) {
  const queryClient = useQueryClient();
  const user = getUser();
  const isBuyer = user?.id === buyerId;

  const { data: milestones, isLoading } = useQuery<Milestone[]>({
    queryKey: ['milestones', escrowId],
    queryFn: async () => {
      const response = await apiClient.get(`/escrows/${escrowId}/milestones`);
      return response.data;
    },
    enabled: !!escrowId,
  });

  const completeMutation = useMutation({
    mutationFn: async (milestoneId: string) => {
      return apiClient.put(`/escrows/${escrowId}/milestones/${milestoneId}/complete`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones', escrowId] });
      queryClient.invalidateQueries({ queryKey: ['escrow', escrowId] });
      toast.success('Milestone marked as completed');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to complete milestone');
    },
  });

  const releaseMutation = useMutation({
    mutationFn: async (milestoneId: string) => {
      return apiClient.put(`/escrows/${escrowId}/milestones/${milestoneId}/release`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones', escrowId] });
      queryClient.invalidateQueries({ queryKey: ['escrow', escrowId] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      toast.success('Milestone funds released to seller');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to release milestone');
    },
  });

  const handleComplete = (milestoneId: string, milestoneName: string) => {
    if (confirm(`Mark "${milestoneName}" as completed?`)) {
      completeMutation.mutate(milestoneId);
    }
  };

  const handleRelease = (milestoneId: string, milestoneName: string) => {
    if (confirm(`Release funds for "${milestoneName}" to seller?`)) {
      releaseMutation.mutate(milestoneId);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-gray-200 animate-pulse rounded" />
        ))}
      </div>
    );
  }

  if (!milestones || milestones.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
        <p>No milestones found</p>
        <p className="text-sm mt-1">This escrow does not use milestone payments</p>
      </div>
    );
  }

  const totalAmount = milestones.reduce((sum, m) => sum + m.amountCents, 0);
  const completedCount = milestones.filter(m => m.status === 'completed' || m.status === 'released').length;
  const releasedCount = milestones.filter(m => m.status === 'released').length;

  return (
    <div className="space-y-4">
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-center justify-between text-sm">
          <div>
            <span className="text-gray-600">Total Milestones:</span>
            <span className="font-medium text-gray-900 ml-2">{milestones.length}</span>
          </div>
          <div>
            <span className="text-gray-600">Total Amount:</span>
            <span className="font-medium text-gray-900 ml-2">
              {formatCurrency(totalAmount, 'GHS')}
            </span>
          </div>
          <div>
            <span className="text-gray-600">Progress:</span>
            <span className="font-medium text-gray-900 ml-2">
              {completedCount}/{milestones.length} completed, {releasedCount} released
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {milestones.map((milestone, index) => {
          const canComplete = isBuyer && milestone.status === 'pending';
          const canRelease = isBuyer && milestone.status === 'completed';

          return (
            <div
              key={milestone.id}
              className={`border rounded-lg p-4 ${
                milestone.status === 'released'
                  ? 'bg-green-50 border-green-200'
                  : milestone.status === 'completed'
                  ? 'bg-blue-50 border-blue-200'
                  : 'bg-white border-gray-200'
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                        milestone.status === 'released'
                          ? 'bg-green-500 text-white'
                          : milestone.status === 'completed'
                          ? 'bg-blue-500 text-white'
                          : 'bg-gray-300 text-gray-700'
                      }`}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{milestone.name}</h4>
                      {milestone.description && (
                        <p className="text-sm text-gray-600 mt-1">{milestone.description}</p>
                      )}
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        {formatCurrency(milestone.amountCents, 'GHS')}
                      </p>
                      <span
                        className={`inline-block px-2 py-1 text-xs font-medium rounded mt-1 ${
                          milestone.status === 'released'
                            ? 'bg-green-100 text-green-800'
                            : milestone.status === 'completed'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}
                      >
                        {milestone.status === 'released'
                          ? 'Released'
                          : milestone.status === 'completed'
                          ? 'Completed'
                          : 'Pending'}
                      </span>
                    </div>
                  </div>

                  {milestone.completedAt && (
                    <p className="text-xs text-gray-500 ml-11">
                      Completed: {formatDate(milestone.completedAt)}
                    </p>
                  )}
                  {milestone.releasedAt && (
                    <p className="text-xs text-gray-500 ml-11">
                      Released: {formatDate(milestone.releasedAt)}
                    </p>
                  )}
                </div>
              </div>

              {isBuyer && (
                <div className="mt-3 ml-11 flex gap-2">
                  {canComplete && (
                    <button
                      onClick={() => handleComplete(milestone.id, milestone.name)}
                      disabled={completeMutation.isPending}
                      className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      {completeMutation.isPending ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Completing...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-3 h-3" />
                          Mark Complete
                        </>
                      )}
                    </button>
                  )}
                  {canRelease && (
                    <button
                      onClick={() => handleRelease(milestone.id, milestone.name)}
                      disabled={releaseMutation.isPending}
                      className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
                    >
                      {releaseMutation.isPending ? (
                        <>
                          <Loader2 className="w-3 h-3 animate-spin" />
                          Releasing...
                        </>
                      ) : (
                        <>
                          <DollarSign className="w-3 h-3" />
                          Release Funds
                        </>
                      )}
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}




