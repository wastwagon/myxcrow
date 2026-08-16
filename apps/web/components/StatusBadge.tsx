import { cn } from '@/lib/utils';
import { formatStatus } from '@/lib/constants';

interface StatusBadgeProps {
  status: string;
  className?: string;
  /** Dark-glass badges. Default is light (grouped #f2f2f7). */
  onDark?: boolean;
}

const statusConfig: Record<string, { label: string; light: string; dark: string }> = {
  DRAFT: {
    label: 'Draft',
    light: 'bg-gray-100 text-gray-800',
    dark: 'bg-white/10 text-white/70 border-white/15',
  },
  AWAITING_FUNDING: {
    label: 'Awaiting Funding',
    light: 'bg-amber-50 text-amber-800',
    dark: 'bg-yellow-500/20 text-yellow-200 border-yellow-500/30',
  },
  FUNDED: {
    label: 'Funded',
    light: 'bg-blue-100 text-blue-800',
    dark: 'bg-blue-500/20 text-blue-200 border-blue-500/30',
  },
  AWAITING_SHIPMENT: {
    label: 'Awaiting Shipment',
    light: 'bg-purple-100 text-purple-800',
    dark: 'bg-purple-500/20 text-purple-200 border-purple-500/30',
  },
  SHIPPED: {
    label: 'Shipped',
    light: 'bg-purple-100 text-purple-800',
    dark: 'bg-purple-500/20 text-purple-200 border-purple-500/30',
  },
  IN_TRANSIT: {
    label: 'In Transit',
    light: 'bg-cyan-100 text-cyan-800',
    dark: 'bg-cyan-500/20 text-cyan-200 border-cyan-500/30',
  },
  DELIVERED: {
    label: 'Delivered',
    light: 'bg-green-100 text-green-800',
    dark: 'bg-emerald-500/20 text-emerald-200 border-emerald-500/30',
  },
  AWAITING_RELEASE: {
    label: 'Awaiting Release',
    light: 'bg-orange-100 text-orange-800',
    dark: 'bg-orange-500/20 text-orange-200 border-orange-500/30',
  },
  RELEASED: {
    label: 'Released',
    light: 'bg-gray-100 text-gray-800',
    dark: 'bg-white/10 text-white/80 border-white/20',
  },
  REFUNDED: {
    label: 'Refunded',
    light: 'bg-red-100 text-red-800',
    dark: 'bg-red-500/20 text-red-200 border-red-500/30',
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
    light: 'bg-amber-50 text-amber-800',
    dark: 'bg-yellow-500/20 text-yellow-200 border-yellow-500/30',
  },
  NEGOTIATION: {
    label: 'Negotiation',
    light: 'bg-amber-100 text-amber-800',
    dark: 'bg-amber-500/20 text-amber-200 border-amber-500/30',
  },
  MEDIATION: {
    label: 'Mediation',
    light: 'bg-orange-100 text-orange-800',
    dark: 'bg-orange-500/20 text-orange-200 border-orange-500/30',
  },
  ARBITRATION: {
    label: 'Arbitration',
    light: 'bg-orange-100 text-orange-800',
    dark: 'bg-orange-500/20 text-orange-200 border-orange-500/30',
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
    light: 'bg-amber-50 text-amber-800',
    dark: 'bg-yellow-500/20 text-yellow-200 border-yellow-500/30',
  },
  PROCESSING: {
    label: 'Processing',
    light: 'bg-blue-100 text-blue-800',
    dark: 'bg-blue-500/20 text-blue-200 border-blue-500/30',
  },
  SUCCEEDED: {
    label: 'Succeeded',
    light: 'bg-green-100 text-green-800',
    dark: 'bg-emerald-500/20 text-emerald-200 border-emerald-500/30',
  },
  COMPLETED: {
    label: 'Completed',
    light: 'bg-green-100 text-green-800',
    dark: 'bg-emerald-500/20 text-emerald-200 border-emerald-500/30',
  },
  FAILED: {
    label: 'Failed',
    light: 'bg-red-100 text-red-800',
    dark: 'bg-red-500/20 text-red-200 border-red-500/30',
  },
  PENDING: {
    label: 'Pending',
    light: 'bg-amber-50 text-amber-800',
    dark: 'bg-yellow-500/20 text-yellow-200 border-yellow-500/30',
  },
  VERIFIED: {
    label: 'Verified',
    light: 'bg-green-100 text-green-800',
    dark: 'bg-emerald-500/20 text-emerald-200 border-emerald-500/30',
  },
  REJECTED: {
    label: 'Rejected',
    light: 'bg-red-100 text-red-800',
    dark: 'bg-red-500/20 text-red-200 border-red-500/30',
  },
  IN_PROGRESS: {
    label: 'In Progress',
    light: 'bg-blue-100 text-blue-800',
    dark: 'bg-blue-500/20 text-blue-200 border-blue-500/30',
  },
  EXPIRED: {
    label: 'Expired',
    light: 'bg-gray-100 text-gray-800',
    dark: 'bg-white/10 text-white/60 border-white/15',
  },
  CANCELED: {
    label: 'Canceled',
    light: 'bg-gray-100 text-gray-800',
    dark: 'bg-white/10 text-white/60 border-white/15',
  },
};

const defaultConfig = {
  label: '',
  light: 'bg-gray-100 text-gray-800',
  dark: 'bg-white/10 text-white/80 border-white/20',
};

export function StatusBadge({ status, className, onDark = false }: StatusBadgeProps) {
  const config = statusConfig[status] ?? defaultConfig;
  const label = config.label || formatStatus(status);

  return (
    <span
      className={cn(
        'px-2.5 py-0.5 text-ios-caption font-medium rounded-full border',
        onDark ? config.dark : config.light,
        className
      )}
    >
      {label}
    </span>
  );
}

export function WithdrawalStatusBadge({
  status,
  className,
  onDark = false,
}: {
  status: string;
  className?: string;
  onDark?: boolean;
}) {
  return <StatusBadge status={status} className={className} onDark={onDark} />;
}
