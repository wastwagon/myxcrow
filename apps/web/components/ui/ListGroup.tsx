import { type ReactNode, createContext, useContext } from 'react';
import { ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';

type ListTone = 'dark' | 'light';

const ListToneContext = createContext<ListTone>('dark');

interface ListGroupProps {
  title?: string;
  footer?: string;
  children: ReactNode;
  className?: string;
  tone?: ListTone;
}

export function ListGroup({ title, footer, children, className, tone = 'dark' }: ListGroupProps) {
  const light = tone === 'light';
  return (
    <ListToneContext.Provider value={tone}>
      <div className={cn('space-y-2.5', className)}>
        {title && (
          <p
            className={cn(
              'px-4 text-ios-footnote font-medium uppercase tracking-wide',
              light ? 'text-gray-500' : 'text-label-tertiary'
            )}
          >
            {title}
          </p>
        )}
        <div
          className={cn(
            'overflow-hidden rounded-ios-xl border backdrop-blur-sm',
            light
              ? 'bg-white border-gray-200'
              : 'bg-white/[0.07] border-white/10'
          )}
        >
          <div className={cn('divide-y', light ? 'divide-gray-100' : 'divide-white/10')}>
            {children}
          </div>
        </div>
        {footer && (
          <p className={cn('px-4 text-ios-footnote', light ? 'text-gray-500' : 'text-label-tertiary')}>
            {footer}
          </p>
        )}
      </div>
    </ListToneContext.Provider>
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
  const tone = useContext(ListToneContext);
  const light = tone === 'light';

  const content = (
    <>
      {leading && <div className="shrink-0 mr-3">{leading}</div>}
      <div className="flex-1 min-w-0">
        <div
          className={cn(
            'text-ios-body font-medium truncate',
            destructive
              ? 'text-ios-destructive'
              : light
                ? 'text-gray-900'
                : 'text-label-primary'
          )}
        >
          {title}
        </div>
        {subtitle && (
          <div
            className={cn(
              'text-ios-footnote mt-0.5 truncate',
              light ? 'text-gray-500' : 'text-label-secondary'
            )}
          >
            {subtitle}
          </div>
        )}
      </div>
      {trailing && <div className="shrink-0 ml-3">{trailing}</div>}
      {showChevron && (
        <ChevronRight
          className={cn('w-5 h-5 shrink-0 ml-2', light ? 'text-gray-400' : 'text-label-tertiary')}
          strokeWidth={2}
          aria-hidden
        />
      )}
    </>
  );

  const rowClass = cn(
    'flex items-center min-h-[52px] px-4 py-3 w-full text-left touch-manipulation transition-colors',
    light ? 'hover:bg-gray-50 active:bg-gray-100' : 'hover:bg-white/5 active:bg-white/10',
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
