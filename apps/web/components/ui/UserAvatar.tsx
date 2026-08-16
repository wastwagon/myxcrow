import { cn } from '@/lib/utils';

const variants = {
  gold: 'bg-amber-50 text-amber-800 ring-amber-200',
  maroon: 'bg-brand-maroon text-white ring-brand-maroon/40',
  muted: 'bg-[#e5e5ea] text-gray-700 ring-[#d1d1d6]',
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

export function UserAvatar({ label, variant = 'maroon', size = 'md', className }: UserAvatarProps) {
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
