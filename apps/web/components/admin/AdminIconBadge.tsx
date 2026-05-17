import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

const variants = {
  gold: 'bg-brand-gold/20 text-brand-gold ring-brand-gold/35',
  emerald: 'bg-emerald-500/20 text-emerald-400 ring-emerald-500/35',
  destructive: 'bg-red-500/20 text-red-400 ring-red-500/35',
  maroon: 'bg-brand-maroon/50 text-white ring-brand-maroon/40',
  amber: 'bg-amber-500/20 text-amber-400 ring-amber-500/35',
  muted: 'bg-white/10 text-white/80 ring-white/15',
} as const;

interface AdminIconBadgeProps {
  children: ReactNode;
  variant?: keyof typeof variants;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: 'w-10 h-10 rounded-lg [&_svg]:w-4 [&_svg]:h-4',
  md: 'w-12 h-12 rounded-ios-lg [&_svg]:w-6 [&_svg]:h-6',
  lg: 'w-14 h-14 rounded-ios-lg [&_svg]:w-7 [&_svg]:h-7',
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
