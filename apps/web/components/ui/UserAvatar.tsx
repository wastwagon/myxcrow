import { cn } from '@/lib/utils';

const variants = {
  gold: 'bg-brand-gold/20 text-brand-gold ring-brand-gold/35',
  maroon: 'bg-brand-maroon/50 text-white ring-brand-maroon/40',
  muted: 'bg-white/10 text-white/90 ring-white/15',
} as const;

interface UserAvatarProps {
  label: string;
  variant?: keyof typeof variants;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const sizes = {
  sm: 'w-8 h-8 text-xs',
  md: 'w-10 h-10 text-sm',
  lg: 'w-16 h-16 text-xl font-bold',
};

export function UserAvatar({ label, variant = 'gold', size = 'md', className }: UserAvatarProps) {
  const initial = (label?.trim()?.[0] || '?').toUpperCase();
  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center font-semibold ring-2 shrink-0',
        variants[variant],
        sizes[size],
        className
      )}
      aria-hidden
    >
      {initial}
    </div>
  );
}
