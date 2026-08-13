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
      <div className={cn(light ? 'space-y-1.5' : 'space-y-2.5', className)}>
        {title && (
          <p
            className={cn(
              'px-4',
              light
                ? 'text-[13px] font-normal text-[rgba(60,60,67,0.6)]'
                : 'text-ios-footnote font-medium uppercase tracking-wide text-label-tertiary'
            )}
          >
            {title}
          </p>
        )}
        <div
          className={cn(
            'overflow-hidden',
            light
              ? 'bg-white rounded-[12px]'
              : 'rounded-ios-xl border backdrop-blur-sm bg-white/[0.07] border-white/10'
          )}
        >
          <div className={light ? undefined : 'divide-y divide-white/10'}>{children}</div>
        </div>
        {footer && (
          <p
            className={cn(
              'px-4',
              light ? 'text-[13px] text-[rgba(60,60,67,0.6)]' : 'text-ios-footnote text-label-tertiary'
            )}
          >
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
            'font-medium truncate',
            light ? 'text-[17px] leading-[22px]' : 'text-ios-body',
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
              'mt-0.5 truncate',
              light ? 'text-[13px] text-[rgba(60,60,67,0.6)]' : 'text-ios-footnote text-label-secondary'
            )}
          >
            {subtitle}
          </div>
        )}
      </div>
      {trailing && <div className="shrink-0 ml-3">{trailing}</div>}
      {showChevron && (
        <ChevronRight
          className={cn('w-5 h-5 shrink-0 ml-1', light ? 'text-[#c7c7cc]' : 'text-label-tertiary')}
          strokeWidth={2}
          aria-hidden
        />
      )}
    </>
  );

  const rowClass = cn(
    'flex items-center min-h-[44px] px-4 py-2.5 w-full text-left touch-manipulation',
    light
      ? cn(
          'relative after:absolute after:right-0 after:bottom-0 after:h-px after:bg-[rgba(60,60,67,0.12)] last:after:hidden',
          leading ? 'after:left-[52px]' : 'after:left-4',
          'active:bg-[#d1d1d6]/40'
        )
      : 'hover:bg-white/5 active:bg-white/10 py-3 min-h-[52px]',
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
