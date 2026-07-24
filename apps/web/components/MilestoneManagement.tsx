import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { formatCurrency, formatDate, cn } from '@/lib/utils';
import { CheckCircle, Clock, DollarSign } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getUser } from '@/lib/auth';
import { useConfirm } from '@/components/providers/UIProvider';
import { ListRowsSkeleton } from '@/components/LoadingSkeleton';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { EmptyState } from '@/components/ui/EmptyState';

interface Milestone {
  id: string;
  name: string;
  description?: string;
  amountCents: number;
  status: 'pending' | 'submitted' | 'approved' | 'completed' | 'released';
  targetDate?: string;
  approvalWindowDays?: number;
  submittedAt?: string;
  approvedAt?: string;
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
  const confirm = useConfirm();
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

  const approveMutation = useMutation({
    mutationFn: async (milestoneId: string) => {
      return apiClient.put(`/escrows/${escrowId}/milestones/${milestoneId}/approve`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['milestones', escrowId] });
      queryClient.invalidateQueries({ queryKey: ['escrow', escrowId] });
      toast.success('Milestone approved');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to approve milestone');
    },
  });

  const handleSubmitMilestone = async (milestoneId: string, milestoneName: string) => {
    const ok = await confirm({
      title: 'Submit milestone',
      message: `Submit "${milestoneName}" for buyer review?`,
      confirmLabel: 'Submit',
    });
    if (ok) completeMutation.mutate(milestoneId);
  };

  const handleApprove = async (milestoneId: string, milestoneName: string) => {
    const ok = await confirm({
      title: 'Approve milestone',
      message: `Approve "${milestoneName}"?`,
      confirmLabel: 'Approve',
    });
    if (ok) approveMutation.mutate(milestoneId);
  };

  const handleRelease = async (milestoneId: string, milestoneName: string) => {
    const ok = await confirm({
      title: 'Release funds',
      message: `Release funds for "${milestoneName}" to seller?`,
      confirmLabel: 'Release',
      destructive: true,
    });
    if (ok) releaseMutation.mutate(milestoneId);
  };

  const getApprovalMeta = (milestone: Milestone) => {
    if (!milestone.submittedAt) return null;
    const windowDays = milestone.approvalWindowDays ?? 5;
    const due = new Date(milestone.submittedAt);
    due.setDate(due.getDate() + windowDays);
    const now = new Date();
    const msLeft = due.getTime() - now.getTime();
    const daysLeft = Math.ceil(msLeft / (24 * 60 * 60 * 1000));
    return { due, daysLeft };
  };

  if (isLoading) {
    return <ListRowsSkeleton rows={3} rowClassName="h-24" />;
  }

  if (!milestones || milestones.length === 0) {
    return (
      <EmptyState
        icon={<Clock className="w-6 h-6" />}
        title="No milestones"
        description="This escrow does not use milestone payments"
        className="py-8"
      />
    );
  }

  const totalAmount = milestones.reduce((sum, m) => sum + m.amountCents, 0);
  const completedCount = milestones.filter(m => ['submitted', 'approved', 'completed', 'released'].includes(m.status)).length;
  const releasedCount = milestones.filter(m => m.status === 'released').length;

  return (
    <div className="space-y-4">
      <div className="rounded-ios-lg border border-brand-gold/30 bg-brand-gold/10 p-4">
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <div>
            <span className="text-label-secondary">Total Milestones:</span>
            <span className="font-medium text-label-primary ml-2">{milestones.length}</span>
          </div>
          <div>
            <span className="text-label-secondary">Total Amount:</span>
            <span className="font-medium text-label-primary ml-2">
              {formatCurrency(totalAmount, 'GHS')}
            </span>
          </div>
          <div>
            <span className="text-label-secondary">Progress:</span>
            <span className="font-medium text-label-primary ml-2">
              {completedCount}/{milestones.length} completed, {releasedCount} released
            </span>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        {milestones.map((milestone, index) => {
          const isSeller = user?.id === sellerId;
          const canSubmit = isSeller && milestone.status === 'pending';
          const canApprove = isBuyer && (milestone.status === 'submitted' || milestone.status === 'completed'); // completed kept for legacy rows
          const canRelease = isBuyer && (milestone.status === 'approved' || milestone.status === 'completed'); // completed kept for legacy rows
          const approvalMeta = getApprovalMeta(milestone);

          return (
            <div
              key={milestone.id}
              className={cn(
                'rounded-ios-lg border p-4',
                milestone.status === 'released'
                  ? 'border-emerald-500/30 bg-emerald-500/15'
                  : milestone.status === 'completed' || milestone.status === 'approved'
                  ? 'border-brand-gold/30 bg-brand-gold/10'
                  : milestone.status === 'submitted'
                  ? 'border-amber-500/30 bg-amber-500/10'
                  : 'border-white/10 bg-white/[0.06]'
              )}
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <div
                      className={cn(
                        'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium',
                        milestone.status === 'released'
                          ? 'bg-emerald-600 text-white'
                          : milestone.status === 'completed' || milestone.status === 'approved'
                          ? 'bg-brand-maroon text-white'
                          : 'bg-white/15 text-label-secondary'
                      )}
                    >
                      {index + 1}
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-label-primary">{milestone.name}</h4>
                      {milestone.description && (
                        <p className="text-sm text-label-secondary mt-1">{milestone.description}</p>
                      )}
                      <div className="flex flex-wrap items-center gap-2 mt-2">
                        {milestone.targetDate && (
                          <Badge color="gold" variant="subtle">
                            Target: {formatDate(milestone.targetDate)}
                          </Badge>
                        )}
                        <Badge color="warning" variant="subtle">
                          Approval window: {milestone.approvalWindowDays ?? 5} day{(milestone.approvalWindowDays ?? 5) > 1 ? 's' : ''}
                        </Badge>
                        {milestone.status === 'submitted' && approvalMeta && (
                          <Badge color={approvalMeta.daysLeft <= 1 ? 'error' : 'warning'} variant="subtle">
                            Auto-approve due: {formatDate(approvalMeta.due)} ({approvalMeta.daysLeft <= 0 ? 'today/overdue' : `${approvalMeta.daysLeft} day(s) left`})
                          </Badge>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-label-primary">
                        {formatCurrency(milestone.amountCents, 'GHS')}
                      </p>
                      <Badge
                        className="mt-1"
                        color={
                          milestone.status === 'released' || milestone.status === 'approved'
                            ? 'success'
                            : milestone.status === 'submitted'
                            ? 'warning'
                            : milestone.status === 'completed'
                            ? 'info'
                            : 'gray'
                        }
                        variant="subtle"
                      >
                        {milestone.status === 'released'
                          ? 'Released'
                          : milestone.status === 'approved'
                          ? 'Approved'
                          : milestone.status === 'submitted'
                          ? 'Submitted'
                          : milestone.status === 'completed'
                          ? 'Completed (Legacy)'
                          : 'Pending'}
                      </Badge>
                    </div>
                  </div>

                  {milestone.submittedAt && (
                    <p className="text-xs text-label-tertiary ml-11">
                      Submitted: {formatDate(milestone.submittedAt)}
                    </p>
                  )}
                  {milestone.approvedAt && (
                    <p className="text-xs text-label-tertiary ml-11">
                      Approved: {formatDate(milestone.approvedAt)}
                    </p>
                  )}
                  {milestone.completedAt && (
                    <p className="text-xs text-label-tertiary ml-11">
                      Completed: {formatDate(milestone.completedAt)}
                    </p>
                  )}
                  {milestone.releasedAt && (
                    <p className="text-xs text-label-tertiary ml-11">
                      Released: {formatDate(milestone.releasedAt)}
                    </p>
                  )}
                </div>
              </div>

              {(isBuyer || user?.id === sellerId) && (
                <div className="mt-3 ml-11 flex flex-wrap gap-2">
                  {canSubmit && (
                    <Button
                      size="sm"
                      onClick={() => handleSubmitMilestone(milestone.id, milestone.name)}
                      loading={completeMutation.isPending}
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Submit for Review
                    </Button>
                  )}
                  {canApprove && (
                    <Button
                      size="sm"
                      variant="tinted"
                      onClick={() => handleApprove(milestone.id, milestone.name)}
                      loading={approveMutation.isPending}
                    >
                      <CheckCircle className="w-3.5 h-3.5" />
                      Approve
                    </Button>
                  )}
                  {canRelease && (
                    <Button
                      size="sm"
                      onClick={() => handleRelease(milestone.id, milestone.name)}
                      loading={releaseMutation.isPending}
                    >
                      <DollarSign className="w-3.5 h-3.5" />
                      Release Funds
                    </Button>
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




