import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { Button, ButtonLink, type ButtonLinkProps } from './Button';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: {
    href?: string;
    onClick?: () => void;
    label: string;
    variant?: ButtonLinkProps['variant'];
  };
  className?: string;
  tone?: 'dark' | 'light';
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className,
  tone = 'light',
}: EmptyStateProps) {
  const light = tone === 'light';
  const variant = action?.variant ?? (light ? 'maroon' : 'filled');
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center px-6 py-12 rounded-[12px] border',
        light
          ? 'bg-transparent border-0'
          : 'border-white/10 bg-white/[0.05]',
        className
      )}
    >
      {icon && (
        <div
          className={cn(
            'mb-4 flex h-14 w-14 items-center justify-center rounded-full',
            light ? 'bg-brand-maroon/10 text-brand-maroon' : 'bg-brand-gold/15 text-brand-gold'
          )}
        >
          {icon}
        </div>
      )}
      <p
        className={cn(
          'text-ios-headline font-semibold mb-1',
          light ? 'text-gray-900' : 'text-label-primary'
        )}
      >
        {title}
      </p>
      {description && (
        <p
          className={cn(
            'text-ios-subhead max-w-sm',
            action ? 'mb-5' : 'mb-0',
            light ? 'text-gray-500' : 'text-label-secondary'
          )}
        >
          {description}
        </p>
      )}
      {action?.href ? (
        <ButtonLink href={action.href} variant={variant} size="md">
          {action.label}
        </ButtonLink>
      ) : action?.onClick ? (
        <Button type="button" variant={variant} size="md" onClick={action.onClick}>
          {action.label}
        </Button>
      ) : null}
    </div>
  );
}
