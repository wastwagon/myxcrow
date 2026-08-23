import { useEffect, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  tone?: 'dark' | 'light';
}

export function Sheet({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  className,
  tone = 'light',
}: SheetProps) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!open) return;
    const scroller = document.getElementById('customer-scroll');
    const prevScrollerOverflow = scroller?.style.overflow ?? '';
    if (scroller) scroller.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => {
      if (scroller) scroller.style.overflow = prevScrollerOverflow;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!mounted || !open) return null;

  const light = tone === 'light';

  return createPortal(
    <div
      className="fixed inset-0 z-[300] flex items-end justify-center p-3 pb-[max(0.75rem,var(--safe-bottom))] xl:items-center xl:p-8"
      role="presentation"
    >
      <button
        type="button"
        className="mx-overlay-dim mx-overlay-in absolute inset-0"
        aria-label="Dismiss"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'sheet-title' : undefined}
        aria-describedby={subtitle ? 'sheet-subtitle' : undefined}
        className={cn(
          'relative z-10 flex w-full max-h-[min(90dvh,720px)] min-h-0 flex-col overflow-hidden rounded-[28px] mx-sheet-in',
          'shadow-[0_24px_64px_-16px_rgba(22,15,16,0.5)]',
          'xl:max-w-[400px] xl:max-h-[min(80dvh,640px)]',
          light
            ? 'bg-[#f2f2f7] ring-1 ring-black/[0.06]'
            : 'bg-[#1f1414] ring-1 ring-white/12',
          className
        )}
        style={{ backgroundColor: light ? '#f2f2f7' : '#1f1414' }}
      >
        <div className="flex justify-center pt-2.5 pb-0.5 shrink-0 xl:hidden" aria-hidden>
          <div className={cn('h-1 w-10 rounded-full', light ? 'bg-black/18' : 'bg-white/25')} />
        </div>
        {title && (
          <div className="flex items-start justify-between gap-3 px-5 pt-2 pb-3 xl:px-6 xl:pt-5 shrink-0">
            <div className="min-w-0 pt-1">
              <h2
                id="sheet-title"
                className={cn(
                  'text-[20px] font-semibold tracking-tight',
                  light ? 'text-gray-900' : 'text-label-primary'
                )}
              >
                {title}
              </h2>
              {subtitle ? (
                <p
                  id="sheet-subtitle"
                  className={cn(
                    'mt-0.5 text-[13px] leading-snug',
                    light ? 'text-[rgba(60,60,67,0.55)]' : 'text-label-tertiary'
                  )}
                >
                  {subtitle}
                </p>
              ) : null}
            </div>
            <button
              type="button"
              onClick={onClose}
              className={cn(
                'inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-full touch-manipulation xl:h-9 xl:w-9',
                light
                  ? 'text-gray-700 bg-black/[0.06] hover:bg-black/[0.1] hover:text-gray-900'
                  : 'text-label-secondary bg-white/10 hover:bg-white/15 hover:text-label-primary'
              )}
              aria-label="Close"
            >
              <X className="h-4 w-4" strokeWidth={2.4} />
            </button>
          </div>
        )}
        <div
          className={cn(
            'min-h-0 flex-1 overflow-y-auto overscroll-contain px-4 xl:px-5',
            footer ? 'pb-2' : 'pb-4 xl:pb-5'
          )}
        >
          {children}
        </div>
        {footer && (
          <div
            className={cn(
              'px-4 pt-3 pb-1 shrink-0 xl:px-5 xl:pb-4',
              light ? 'border-t border-[rgba(60,60,67,0.12)]' : 'border-t border-white/10'
            )}
          >
            {footer}
          </div>
        )}
      </div>
    </div>,
    document.body
  );
}
