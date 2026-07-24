import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { ButtonLink, type ButtonLinkProps } from './Button';

export interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: { href: string; label: string; variant?: ButtonLinkProps['variant'] };
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'flex flex-col items-center justify-center text-center px-6 py-12 rounded-ios-xl border border-white/10 bg-white/[0.05]',
        className
      )}
    >
      {icon && (
        <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-brand-gold/15 text-brand-gold">
          {icon}
        </div>
      )}
      <p className="text-ios-headline text-label-primary font-semibold mb-1">{title}</p>
      {description && (
        <p className="text-ios-subhead text-label-secondary max-w-sm mb-5">{description}</p>
      )}
      {action && (
        <ButtonLink href={action.href} variant={action.variant ?? 'filled'} size="md">
          {action.label}
        </ButtonLink>
      )}
    </div>
  );
}
