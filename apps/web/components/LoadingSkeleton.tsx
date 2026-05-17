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

export function TableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="animate-pulse">
      <div className="space-y-3">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="h-16 bg-white/10 rounded-ios-lg" />
        ))}
      </div>
    </div>
  );
}
