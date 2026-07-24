import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type BadgeColor =
  | 'gray'
  | 'gold'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'purple';

export type BadgeVariant = 'subtle' | 'solid' | 'outline';

const colorMap: Record<BadgeColor, Record<BadgeVariant, string>> = {
  gray: {
    subtle: 'bg-white/10 text-white/75 border-white/15',
    solid: 'bg-white/25 text-white border-transparent',
    outline: 'bg-transparent text-white/75 border-white/25',
  },
  gold: {
    subtle: 'bg-brand-gold/15 text-brand-gold border-brand-gold/30',
    solid: 'bg-brand-gold text-brand-maroon-black border-transparent',
    outline: 'bg-transparent text-brand-gold border-brand-gold/45',
  },
  success: {
    subtle: 'bg-emerald-500/20 text-emerald-200 border-emerald-500/30',
    solid: 'bg-emerald-500 text-white border-transparent',
    outline: 'bg-transparent text-emerald-200 border-emerald-500/40',
  },
  warning: {
    subtle: 'bg-amber-500/20 text-amber-200 border-amber-500/30',
    solid: 'bg-amber-500 text-brand-maroon-black border-transparent',
    outline: 'bg-transparent text-amber-200 border-amber-500/40',
  },
  error: {
    subtle: 'bg-red-500/20 text-red-200 border-red-500/30',
    solid: 'bg-red-500 text-white border-transparent',
    outline: 'bg-transparent text-red-200 border-red-500/40',
  },
  info: {
    subtle: 'bg-blue-500/20 text-blue-200 border-blue-500/30',
    solid: 'bg-blue-500 text-white border-transparent',
    outline: 'bg-transparent text-blue-200 border-blue-500/40',
  },
  purple: {
    subtle: 'bg-purple-500/20 text-purple-200 border-purple-500/30',
    solid: 'bg-purple-500 text-white border-transparent',
    outline: 'bg-transparent text-purple-200 border-purple-500/40',
  },
};

export interface BadgeProps {
  children: ReactNode;
  color?: BadgeColor;
  variant?: BadgeVariant;
  dot?: boolean;
  icon?: ReactNode;
  className?: string;
}

export function Badge({
  children,
  color = 'gray',
  variant = 'subtle',
  dot,
  icon,
  className,
}: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 text-ios-caption font-medium rounded-full border',
        colorMap[color][variant],
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            color === 'gold' && 'bg-brand-gold',
            color === 'success' && 'bg-emerald-300',
            color === 'warning' && 'bg-amber-300',
            color === 'error' && 'bg-red-300',
            color === 'info' && 'bg-blue-300',
            color === 'purple' && 'bg-purple-300',
            color === 'gray' && 'bg-white/60'
          )}
          aria-hidden
        />
      )}
      {icon}
      {children}
    </span>
  );
}
