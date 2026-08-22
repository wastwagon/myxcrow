import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';
import Link, { type LinkProps } from 'next/link';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

const variants = {
  filled: 'bg-brand-gold text-brand-maroon-black hover:bg-brand-gold/90 active:opacity-80',
  tinted:
    'bg-brand-gold/25 text-brand-gold border border-brand-gold/45 hover:bg-brand-gold/35 active:opacity-80 shadow-sm shadow-black/10',
  plain: 'bg-transparent text-brand-gold hover:bg-white/10 active:opacity-80',
  destructive: 'bg-ios-destructive mx-cta hover:opacity-90 active:opacity-80 shadow-sm shadow-black/15',
  secondary:
    'bg-white/15 text-white border border-white/50 hover:bg-white/25 active:opacity-80 backdrop-blur-sm',
  /** White outline for photography / maroon marketing surfaces */
  ghost:
    'bg-transparent text-white border-2 border-white/80 hover:bg-white/20 hover:border-white active:opacity-90',
  /** Maroon primary for light auth/customer surfaces */
  maroon:
    'bg-brand-maroon mx-cta hover:bg-brand-maroon-dark active:opacity-90',
  /** Outline on light surfaces */
  outline:
    'bg-transparent border-2 border-brand-maroon text-brand-maroon hover:bg-brand-maroon/5 active:opacity-90',
} as const;

const sizes = {
  sm: 'min-h-[44px] px-3.5 py-2 text-ios-footnote rounded-[16px]',
  md: 'min-h-[44px] px-4 py-2.5 text-ios-body rounded-[16px]',
  lg: 'min-h-[50px] px-5 py-3 text-ios-headline rounded-[16px]',
} as const;

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  fullWidth?: boolean;
  loading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'filled',
      size = 'md',
      fullWidth,
      loading,
      disabled,
      children,
      type = 'button',
      ...props
    },
    ref
  ) => {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center gap-2 font-semibold transition-colors',
          'disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation',
          variants[variant],
          sizes[size],
          fullWidth && 'w-full',
          className
        )}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin shrink-0" aria-hidden />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';

export type ButtonLinkProps = Omit<LinkProps, 'className'> & {
  children: ReactNode;
  className?: string;
  variant?: keyof typeof variants;
  size?: keyof typeof sizes;
  fullWidth?: boolean;
};

/** Next.js Link styled like Button — use for primary navigation CTAs. */
export function ButtonLink({
  children,
  className,
  variant = 'filled',
  size = 'md',
  fullWidth,
  ...props
}: ButtonLinkProps) {
  return (
    <Link
      className={cn(
        'inline-flex items-center justify-center gap-2 font-semibold transition-colors touch-manipulation',
        variants[variant],
        sizes[size],
        fullWidth && 'w-full',
        className
      )}
      {...props}
    >
      {children}
    </Link>
  );
}
