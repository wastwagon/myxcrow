import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export type BadgeColor =
  | 'gray'
  | 'gold'
  | 'success'
  | 'warning'
  | 'error'
  | 'info'
  | 'purple'
  | 'maroon';

export type BadgeVariant = 'subtle' | 'solid' | 'outline';

const colorMapDark: Record<BadgeColor, Record<BadgeVariant, string>> = {
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
  maroon: {
    subtle: 'bg-brand-maroon/25 text-brand-gold border-brand-maroon/40',
    solid: 'bg-brand-maroon text-white border-transparent',
    outline: 'bg-transparent text-brand-gold border-brand-maroon/50',
  },
};

const colorMapLight: Record<BadgeColor, Record<BadgeVariant, string>> = {
  gray: {
    subtle: 'bg-gray-100 text-gray-700 border-gray-200',
    solid: 'bg-gray-700 text-white border-transparent',
    outline: 'bg-transparent text-gray-700 border-gray-300',
  },
  gold: {
    subtle: 'bg-amber-50 text-amber-800 border-amber-200',
    solid: 'bg-amber-500 text-brand-maroon-black border-transparent',
    outline: 'bg-transparent text-amber-800 border-amber-300',
  },
  success: {
    subtle: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    solid: 'bg-emerald-600 text-white border-transparent',
    outline: 'bg-transparent text-emerald-700 border-emerald-300',
  },
  warning: {
    subtle: 'bg-amber-50 text-amber-800 border-amber-200',
    solid: 'bg-amber-500 text-brand-maroon-black border-transparent',
    outline: 'bg-transparent text-amber-800 border-amber-300',
  },
  error: {
    subtle: 'bg-red-50 text-red-700 border-red-200',
    solid: 'bg-red-600 text-white border-transparent',
    outline: 'bg-transparent text-red-700 border-red-300',
  },
  info: {
    subtle: 'bg-blue-50 text-blue-700 border-blue-200',
    solid: 'bg-blue-600 text-white border-transparent',
    outline: 'bg-transparent text-blue-700 border-blue-300',
  },
  purple: {
    subtle: 'bg-brand-maroon/10 text-brand-maroon border-brand-maroon/20',
    solid: 'bg-brand-maroon text-white border-transparent',
    outline: 'bg-transparent text-brand-maroon border-brand-maroon/30',
  },
  maroon: {
    subtle: 'bg-brand-maroon/10 text-brand-maroon border-brand-maroon/20',
    solid: 'bg-brand-maroon text-white border-transparent',
    outline: 'bg-transparent text-brand-maroon border-brand-maroon/30',
  },
};

export interface BadgeProps {
  children: ReactNode;
  color?: BadgeColor;
  variant?: BadgeVariant;
  dot?: boolean;
  icon?: ReactNode;
  className?: string;
  tone?: 'dark' | 'light';
}

export function Badge({
  children,
  color = 'gray',
  variant = 'subtle',
  dot,
  icon,
  className,
  tone = 'light',
}: BadgeProps) {
  const map = tone === 'light' ? colorMapLight : colorMapDark;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 px-2.5 py-0.5 text-ios-caption font-medium rounded-full border',
        map[color][variant],
        className
      )}
    >
      {dot && (
        <span
          className={cn(
            'h-1.5 w-1.5 rounded-full',
            color === 'gold' && 'bg-brand-gold',
            color === 'success' && (tone === 'light' ? 'bg-emerald-500' : 'bg-emerald-300'),
            color === 'warning' && (tone === 'light' ? 'bg-amber-500' : 'bg-amber-300'),
            color === 'error' && (tone === 'light' ? 'bg-red-500' : 'bg-red-300'),
            color === 'info' && (tone === 'light' ? 'bg-blue-500' : 'bg-blue-300'),
            (color === 'purple' || color === 'maroon') && 'bg-brand-maroon',
            color === 'gray' && (tone === 'light' ? 'bg-gray-400' : 'bg-white/60')
          )}
          aria-hidden
        />
      )}
      {icon}
      {children}
    </span>
  );
}
