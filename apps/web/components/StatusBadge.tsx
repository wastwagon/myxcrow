import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

const statusConfig: Record<string, { label: string; className: string }> = {
  AWAITING_FUNDING: {
    label: 'Awaiting Funding',
    className: 'bg-yellow-100 text-yellow-800',
  },
  FUNDED: {
    label: 'Funded',
    className: 'bg-blue-100 text-blue-800',
  },
  SHIPPED: {
    label: 'Shipped',
    className: 'bg-purple-100 text-purple-800',
  },
  DELIVERED: {
    label: 'Delivered',
    className: 'bg-green-100 text-green-800',
  },
  RELEASED: {
    label: 'Released',
    className: 'bg-gray-100 text-gray-800',
  },
  DISPUTED: {
    label: 'Disputed',
    className: 'bg-red-100 text-red-800',
  },
  CANCELLED: {
    label: 'Cancelled',
    className: 'bg-gray-100 text-gray-800',
  },
  OPEN: {
    label: 'Open',
    className: 'bg-yellow-100 text-yellow-800',
  },
  RESOLVED: {
    label: 'Resolved',
    className: 'bg-green-100 text-green-800',
  },
  CLOSED: {
    label: 'Closed',
    className: 'bg-gray-100 text-gray-800',
  },
  REQUESTED: {
    label: 'Requested',
    className: 'bg-yellow-100 text-yellow-800',
  },
  SUCCEEDED: {
    label: 'Succeeded',
    className: 'bg-green-100 text-green-800',
  },
  FAILED: {
    label: 'Failed',
    className: 'bg-red-100 text-red-800',
  },
};

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const config = statusConfig[status] || {
    label: status.replace('_', ' '),
    className: 'bg-gray-100 text-gray-800',
  };

  return (
    <span
      className={cn(
        'px-2 py-1 text-xs font-medium rounded',
        config.className,
        className
      )}
    >
      {config.label}
    </span>
  );
}




