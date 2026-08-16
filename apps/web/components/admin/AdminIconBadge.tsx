import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

const variants = {
  gold: 'bg-amber-50 text-amber-800 ring-amber-200',
  emerald: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  destructive: 'bg-red-50 text-red-700 ring-red-200',
  maroon: 'bg-brand-maroon text-white ring-brand-maroon/40',
  amber: 'bg-amber-50 text-amber-800 ring-amber-200',
  muted: 'bg-gray-100 text-gray-800 ring-gray-200',
} as const;

interface AdminIconBadgeProps {
  children: ReactNode;
  variant?: keyof typeof variants;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: 'w-10 h-10 rounded-[12px] [&_svg]:w-4 [&_svg]:h-4',
  md: 'w-12 h-12 rounded-[12px] [&_svg]:w-6 [&_svg]:h-6',
  lg: 'w-14 h-14 rounded-[12px] [&_svg]:w-7 [&_svg]:h-7',
};

export function AdminIconBadge({
  children,
  variant = 'gold',
  size = 'md',
  className,
}: AdminIconBadgeProps) {
  return (
    <div
      className={cn(
        'flex items-center justify-center ring-1 shrink-0',
        variants[variant],
        sizes[size],
        className
      )}
    >
      {children}
    </div>
  );
}

interface AdminAvatarProps {
  label: string;
  variant?: keyof typeof variants;
  className?: string;
}

export function AdminAvatar({ label, variant = 'muted', className }: AdminAvatarProps) {
  const initial = (label?.trim()?.[0] || '?').toUpperCase();
  return (
    <div
      className={cn(
        'w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ring-1 shrink-0',
        variants[variant],
        className
      )}
    >
      {initial}
    </div>
  );
}
