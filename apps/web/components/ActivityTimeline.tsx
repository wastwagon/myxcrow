import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { formatDate } from '@/lib/utils';
import { getUser } from '@/lib/auth';
import { 
  Clock, DollarSign, Truck, Package, CheckCircle, 
  AlertCircle, XCircle, FileText, MessageSquare 
} from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';

interface AuditLog {
  id: string;
  action: string;
  resource: string;
  resourceId: string;
  details: any;
  createdAt: string;
  user?: {
    id: string;
    email: string;
  };
}

interface ActivityTimelineProps {
  escrowId: string;
}

const actionIcons: Record<string, any> = {
  escrow_created: FileText,
  escrow_funded: DollarSign,
  escrow_shipped: Truck,
  escrow_delivered: Package,
  escrow_released: CheckCircle,
  escrow_refunded: XCircle,
  escrow_cancelled: XCircle,
  escrow_disputed: AlertCircle,
  dispute_resolved: CheckCircle,
  milestone_completed: CheckCircle,
  milestone_released: DollarSign,
};

const actionLabels: Record<string, string> = {
  escrow_created: 'Escrow Created',
  escrow_funded: 'Escrow Funded',
  escrow_shipped: 'Item Shipped',
  escrow_delivered: 'Item Delivered',
  escrow_released: 'Funds Released',
  escrow_refunded: 'Escrow Refunded',
  escrow_cancelled: 'Escrow Cancelled',
  escrow_disputed: 'Dispute Opened',
  dispute_resolved: 'Dispute Resolved',
  milestone_completed: 'Milestone Completed',
  milestone_released: 'Milestone Released',
};

const actionColors: Record<string, string> = {
  escrow_created: 'bg-blue-500',
  escrow_funded: 'bg-green-500',
  escrow_shipped: 'bg-purple-500',
  escrow_delivered: 'bg-indigo-500',
  escrow_released: 'bg-teal-500',
  escrow_refunded: 'bg-orange-500',
  escrow_cancelled: 'bg-gray-400',
  escrow_disputed: 'bg-red-500',
  dispute_resolved: 'bg-green-500',
  milestone_completed: 'bg-blue-500',
  milestone_released: 'bg-green-500',
};

export default function ActivityTimeline({ escrowId }: ActivityTimelineProps) {
  const user = getUser();
  const roles = user?.roles || [];
  const canViewAudit = roles.includes('ADMIN') || roles.includes('AUDITOR');

  const { data: auditLogs, isLoading } = useQuery<AuditLog[]>({
    queryKey: ['audit-logs', escrowId],
    queryFn: async () => {
      try {
        const response = await apiClient.get('/audit', {
          params: {
            resource: 'escrow',
            resourceId: escrowId,
            limit: 50,
          },
        });
        return response.data;
      } catch (error: any) {
        // If audit endpoint requires admin, return empty array
        if (error.response?.status === 403) {
          return [];
        }
        throw error;
      }
    },
    enabled: !!escrowId && canViewAudit,
  });

  if (!canViewAudit) {
    return (
      <EmptyState
        tone="light"
        icon={<Clock className="w-6 h-6" />}
        title="Activity timeline"
        description="Visible to admin and auditor roles."
        className="py-8"
      />
    );
  }

  if (isLoading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="flex items-start gap-4">
            <div className="w-8 h-8 bg-black/5 animate-pulse rounded-full" />
            <div className="flex-1">
              <div className="h-4 bg-black/5 animate-pulse rounded w-1/3 mb-2" />
              <div className="h-3 bg-black/5 animate-pulse rounded w-1/4" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  if (!auditLogs || auditLogs.length === 0) {
    return (
      <EmptyState
        tone="light"
        icon={<Clock className="w-6 h-6" />}
        title="No activity yet"
        description="Timeline events appear as this escrow moves through funding, delivery, and release."
        className="py-8"
      />
    );
  }

  return (
    <div className="space-y-4">
      {auditLogs.map((log, index) => {
        const Icon = actionIcons[log.action] || Clock;
        const label = actionLabels[log.action] || log.action.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
        const color = actionColors[log.action] || 'bg-gray-400';

        return (
          <div key={log.id} className="flex items-start gap-4">
            <div className={`w-8 h-8 ${color} rounded-full flex items-center justify-center text-white flex-shrink-0`}>
              <Icon className="w-4 h-4" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{label}</p>
                  {log.user && (
                    <p className="text-sm text-[rgba(60,60,67,0.6)]">by {log.user.email}</p>
                  )}
                  {log.details && typeof log.details === 'object' && (
                    <div className="mt-1 text-sm text-gray-500">
                      {log.details.amountCents && (
                        <span>Amount: GHS {(log.details.amountCents / 100).toFixed(2)}</span>
                      )}
                      {log.details.milestoneName && (
                        <span>Milestone: {log.details.milestoneName}</span>
                      )}
                      {log.details.reason && (
                        <span>Reason: {log.details.reason}</span>
                      )}
                    </div>
                  )}
                </div>
                <p className="text-sm text-gray-500 whitespace-nowrap">
                  {formatDate(log.createdAt)}
                </p>
              </div>
              {index < auditLogs.length - 1 && (
                <div className="h-4 w-0.5 bg-[var(--separator)] ml-4 mt-2" />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}




