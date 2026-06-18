import { type ReactNode } from 'react';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface ListGroupProps {
  title?: string;
  footer?: string;
  children: ReactNode;
  className?: string;
}

export function ListGroup({ title, footer, children, className }: ListGroupProps) {
  return (
    <div className={cn('space-y-2.5', className)}>
      {title && (
        <p className="px-4 text-ios-footnote font-medium text-label-tertiary uppercase tracking-wide">
          {title}
        </p>
      )}
      <div className="overflow-hidden rounded-ios-xl bg-white/[0.07] border border-white/10 backdrop-blur-sm">
        <div className="divide-y divide-white/10">{children}</div>
      </div>
      {footer && <p className="px-4 text-ios-footnote text-label-tertiary">{footer}</p>}
    </div>
  );
}

interface ListRowProps {
  href?: string;
  onClick?: () => void;
  leading?: ReactNode;
  title: ReactNode;
  subtitle?: ReactNode;
  trailing?: ReactNode;
  showChevron?: boolean;
  destructive?: boolean;
  className?: string;
}

export function ListRow({
  href,
  onClick,
  leading,
  title,
  subtitle,
  trailing,
  showChevron = !!href,
  destructive,
  className,
}: ListRowProps) {
  const content = (
    <>
      {leading && <div className="shrink-0 mr-3">{leading}</div>}
      <div className="flex-1 min-w-0">
        <div
          className={cn(
            'text-ios-body font-medium truncate',
            destructive ? 'text-ios-destructive' : 'text-label-primary'
          )}
        >
          {title}
        </div>
        {subtitle && (
          <div className="text-ios-footnote text-label-secondary mt-0.5 truncate">{subtitle}</div>
        )}
      </div>
      {trailing && <div className="shrink-0 ml-3">{trailing}</div>}
      {showChevron && (
        <ChevronRight
          className="w-5 h-5 text-label-tertiary shrink-0 ml-2"
          strokeWidth={2}
          aria-hidden
        />
      )}
    </>
  );

  const rowClass = cn(
    'flex items-center min-h-[52px] px-4 py-3 w-full text-left',
    'hover:bg-white/5 active:bg-white/10 transition-colors touch-manipulation',
    className
  );

  if (href) {
    return (
      <Link href={href} className={rowClass}>
        {content}
      </Link>
    );
  }

  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={rowClass}>
        {content}
      </button>
    );
  }

  return <div className={rowClass}>{content}</div>;
}
