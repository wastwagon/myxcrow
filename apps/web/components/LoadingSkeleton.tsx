import { form } from '@/lib/form-classes';

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
          className="h-4 bg-white/15 rounded-ios"
          style={{ width: i === lines - 1 ? '75%' : '100%' }}
        />
      ))}
    </div>
  );
}

export function CardSkeleton() {
  return (
    <div className={`${form.panel} animate-pulse`}>
      <div className="h-6 bg-white/15 rounded-ios w-1/3 mb-4" />
      <div className="space-y-3">
        <div className="h-4 bg-white/15 rounded-ios" />
        <div className="h-4 bg-white/15 rounded-ios w-5/6" />
        <div className="h-4 bg-white/15 rounded-ios w-4/6" />
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
        <div key={i} className={`${rowClassName} bg-white/10 rounded-ios-xl`} />
      ))}
    </div>
  );
}

/** Standard loading state for escrow/dispute detail pages */
export function PageDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="h-8 bg-white/10 animate-pulse rounded-ios w-1/3" />
      <CardSkeleton />
    </div>
  );
}

/** Public profile header + panels */
export function ProfilePageSkeleton() {
  return (
    <div className="space-y-6 animate-pulse">
      <div className="h-32 bg-white/10 rounded-ios-xl" />
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
