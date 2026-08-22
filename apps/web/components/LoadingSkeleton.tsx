import { form } from '@/lib/form-classes';

/** Full-viewport spinner for auth redirects — keeps splash/safe-area light. */
export function PageSpinner({ label = 'Loading' }: { label?: string }) {
  return (
    <div
      className="flex items-center justify-center min-h-[100svh] pt-safe bg-[#f2f2f7]"
      role="status"
      aria-label={label}
    >
      <div className="animate-spin rounded-full h-10 w-10 border-2 border-gray-200 border-t-brand-maroon" />
    </div>
  );
}

interface LoadingSkeletonProps {
  lines?: number;
  className?: string;
}

export function LoadingSkeleton({ lines = 3, className = '' }: LoadingSkeletonProps) {
  return (
    <div className={`animate-pulse space-y-3 ${className}`}>
      {Array.from({ length: lines }).map((_, i) => (
        <div
          key={i}
          className="h-4 bg-[var(--skeleton)] rounded-[16px]"
          style={{ width: i === lines - 1 ? '75%' : '100%' }}
        />
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className={`${form.panel} animate-pulse`}>
      <div className="h-6 bg-[var(--skeleton)] rounded-[16px] w-1/3 mb-4" />
      <div className="space-y-3">
        <div className="h-4 bg-[var(--skeleton)] rounded-[16px]" />
        <div className="h-4 bg-[var(--skeleton)] rounded-[16px] w-5/6" />
        <div className="h-4 bg-[var(--skeleton)] rounded-[16px] w-4/6" />
      </div>
    </div>
  );
}

export function ListRowsSkeleton({
  rows = 5,
  rowClassName = 'h-20',
}: {
  rows?: number;
  rowClassName?: string;
}) {
  return (
    <div className="space-y-3 animate-pulse">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className={`${rowClassName} bg-[var(--skeleton)] rounded-[16px]`} />
      ))}
    </div>
  );
}

/** Standard loading state for escrow/dispute detail pages */
export function PageDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 bg-[var(--skeleton)] animate-pulse rounded-[16px] w-1/3" />
      <CardSkeleton />
    </div>
  );
}

/** Public profile header + panels */
export function ProfilePageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-32 bg-[var(--skeleton)] rounded-[20px]" />
      <div className="grid md:grid-cols-2 gap-6">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return <ListRowsSkeleton rows={rows} rowClassName="h-16" />;
}
