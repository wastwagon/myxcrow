import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
  /** Use on dark app backgrounds (default). Set false for light admin cards. */
  onDark?: boolean;
}

const statusConfig: Record<string, { label: string; light: string; dark: string }> = {
  AWAITING_FUNDING: {
    label: 'Awaiting Funding',
    light: 'bg-yellow-100 text-yellow-800',
    dark: 'bg-yellow-500/20 text-yellow-200 border-yellow-500/30',
  },
  FUNDED: {
    label: 'Funded',
    light: 'bg-blue-100 text-blue-800',
    dark: 'bg-blue-500/20 text-blue-200 border-blue-500/30',
  },
  SHIPPED: {
    label: 'Shipped',
    light: 'bg-purple-100 text-purple-800',
    dark: 'bg-purple-500/20 text-purple-200 border-purple-500/30',
  },
  DELIVERED: {
    label: 'Delivered',
    light: 'bg-green-100 text-green-800',
    dark: 'bg-emerald-500/20 text-emerald-200 border-emerald-500/30',
  },
  RELEASED: {
    label: 'Released',
    light: 'bg-gray-100 text-gray-800',
    dark: 'bg-white/10 text-white/80 border-white/20',
  },
  DISPUTED: {
    label: 'Disputed',
    light: 'bg-red-100 text-red-800',
    dark: 'bg-red-500/20 text-red-200 border-red-500/30',
  },
  CANCELLED: {
    label: 'Cancelled',
    light: 'bg-gray-100 text-gray-800',
    dark: 'bg-white/10 text-white/60 border-white/15',
  },
  OPEN: {
    label: 'Open',
    light: 'bg-yellow-100 text-yellow-800',
    dark: 'bg-yellow-500/20 text-yellow-200 border-yellow-500/30',
  },
  RESOLVED: {
    label: 'Resolved',
    light: 'bg-green-100 text-green-800',
    dark: 'bg-emerald-500/20 text-emerald-200 border-emerald-500/30',
  },
  CLOSED: {
    label: 'Closed',
    light: 'bg-gray-100 text-gray-800',
    dark: 'bg-white/10 text-white/60 border-white/15',
  },
  REQUESTED: {
    label: 'Requested',
    light: 'bg-yellow-100 text-yellow-800',
    dark: 'bg-yellow-500/20 text-yellow-200 border-yellow-500/30',
  },
  SUCCEEDED: {
    label: 'Succeeded',
    light: 'bg-green-100 text-green-800',
    dark: 'bg-emerald-500/20 text-emerald-200 border-emerald-500/30',
  },
  FAILED: {
    label: 'Failed',
    light: 'bg-red-100 text-red-800',
    dark: 'bg-red-500/20 text-red-200 border-red-500/30',
  },
};

export function StatusBadge({ status, className, onDark = true }: StatusBadgeProps) {
  const config = statusConfig[status] || {
    label: status.replace(/_/g, ' '),
    light: 'bg-gray-100 text-gray-800',
    dark: 'bg-white/10 text-white/80 border-white/20',
  };

  return (
    <span
      className={cn(
        'px-2.5 py-0.5 text-ios-caption font-medium rounded-full border',
        onDark ? config.dark : config.light,
        className
      )}
    >
      {config.label}
    </span>
  );
}
