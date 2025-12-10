import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Clock, AlertTriangle, CheckCircle } from 'lucide-react';

interface DisputeSLATimerProps {
  disputeId: string;
}

interface SLA {
  status: 'on_time' | 'warning' | 'overdue';
  ageDays: number;
  initialResponseDeadline: string;
  resolutionDeadline: string;
  isOverdue: boolean;
  isWarning: boolean;
  disputeStatus: string;
}

export default function DisputeSLATimer({ disputeId }: DisputeSLATimerProps) {
  const { data: sla, isLoading } = useQuery<SLA>({
    queryKey: ['dispute-sla', disputeId],
    queryFn: async () => {
      const response = await apiClient.get(`/disputes/${disputeId}/sla`);
      return response.data;
    },
    enabled: !!disputeId,
    refetchInterval: 60000, // Refresh every minute
  });

  if (isLoading || !sla) {
    return null;
  }

  const getStatusColor = () => {
    if (sla.status === 'overdue') return 'bg-red-100 text-red-800 border-red-300';
    if (sla.status === 'warning') return 'bg-yellow-100 text-yellow-800 border-yellow-300';
    return 'bg-green-100 text-green-800 border-green-300';
  };

  const getStatusIcon = () => {
    if (sla.status === 'overdue') return <AlertTriangle className="w-5 h-5" />;
    if (sla.status === 'warning') return <Clock className="w-5 h-5" />;
    return <CheckCircle className="w-5 h-5" />;
  };

  const getStatusText = () => {
    if (sla.status === 'overdue') return 'Overdue';
    if (sla.status === 'warning') return 'Warning';
    return 'On Time';
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <div className={`border-2 rounded-lg p-4 ${getStatusColor()}`}>
      <div className="flex items-center gap-3 mb-3">
        {getStatusIcon()}
        <div>
          <h3 className="font-semibold">SLA Status: {getStatusText()}</h3>
          <p className="text-sm opacity-75">
            {sla.ageDays} day{sla.ageDays !== 1 ? 's' : ''} since dispute opened
          </p>
        </div>
      </div>
      <div className="space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="opacity-75">Initial Response Deadline:</span>
          <span className="font-medium">{formatDate(sla.initialResponseDeadline)}</span>
        </div>
        <div className="flex justify-between">
          <span className="opacity-75">Resolution Deadline:</span>
          <span className="font-medium">{formatDate(sla.resolutionDeadline)}</span>
        </div>
        {sla.isOverdue && (
          <div className="mt-2 pt-2 border-t border-current opacity-50">
            <p className="font-medium">⚠️ This dispute has exceeded the resolution SLA</p>
          </div>
        )}
        {sla.isWarning && !sla.isOverdue && (
          <div className="mt-2 pt-2 border-t border-current opacity-50">
            <p className="font-medium">⚠️ Approaching resolution deadline</p>
          </div>
        )}
      </div>
    </div>
  );
}




