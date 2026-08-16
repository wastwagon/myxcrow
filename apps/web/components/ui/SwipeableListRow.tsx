import { useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { hapticLight } from '@/lib/haptics';
import { cn } from '@/lib/utils';

const ACTION_WIDTH = 72;
const OPEN_THRESHOLD = 40;

interface SwipeAction {
  label: string;
  href?: string;
  onClick?: () => void;
  variant?: 'default' | 'destructive';
}

interface SwipeableListRowProps {
  children: ReactNode;
  actions?: SwipeAction[];
  className?: string;
  /** Disable swipe (e.g. desktop) */
  disabled?: boolean;
}

export function SwipeableListRow({
  children,
  actions = [],
  className,
  disabled,
}: SwipeableListRowProps) {
  const [offset, setOffset] = useState(0);
  const startX = useRef(0);
  const startOffset = useRef(0);
  const swiping = useRef(false);

  const maxOffset = actions.length * ACTION_WIDTH;

  const onTouchStart = (e: React.TouchEvent) => {
    if (disabled || actions.length === 0) return;
    startX.current = e.touches[0].clientX;
    startOffset.current = offset;
    swiping.current = true;
  };

  const onTouchMove = (e: React.TouchEvent) => {
    if (!swiping.current) return;
    const delta = e.touches[0].clientX - startX.current;
    const next = Math.min(0, Math.max(-maxOffset, startOffset.current + delta));
    setOffset(next);
  };

  const onTouchEnd = () => {
    if (!swiping.current) return;
    swiping.current = false;
    const willOpen = Math.abs(offset) > OPEN_THRESHOLD;
    setOffset(willOpen ? -maxOffset : 0);
    if (willOpen) hapticLight();
  };

  if (disabled || actions.length === 0) {
    return <div className={className}>{children}</div>;
  }

  return (
    <div className={cn('relative overflow-hidden', className)}>
      <div
        className="absolute right-0 top-0 bottom-0 flex"
        style={{ width: maxOffset }}
        aria-hidden={offset === 0}
      >
        {actions.map((action) => {
          const btnClass = cn(
            'flex flex-col items-center justify-center w-[72px] h-full text-ios-caption font-semibold touch-manipulation',
            action.variant === 'destructive'
              ? 'bg-ios-destructive/90 text-white'
              : 'bg-brand-maroon text-white'
          );
          if (action.href) {
            return (
              <Link key={action.label} href={action.href} className={btnClass}>
                {action.label}
              </Link>
            );
          }
          return (
            <button
              key={action.label}
              type="button"
              className={btnClass}
              onClick={() => {
                action.onClick?.();
                setOffset(0);
              }}
            >
              {action.label}
            </button>
          );
        })}
      </div>
      <div
        className="relative bg-inherit transition-transform duration-200 ease-out"
        style={{ transform: `translateX(${offset}px)` }}
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        {children}
      </div>
    </div>
  );
}
