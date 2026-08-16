import { useEffect, type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SheetProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
  tone?: 'dark' | 'light';
}

export function Sheet({ open, onClose, title, children, footer, className, tone = 'light' }: SheetProps) {
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex flex-col justify-end" role="presentation">
      <button
        type="button"
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        aria-label="Dismiss"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? 'sheet-title' : undefined}
        className={cn(
          'relative z-10 w-full max-h-[90vh] flex flex-col rounded-t-[20px] shadow-2xl',
          tone === 'light'
            ? 'bg-[#f2f2f7] pb-[max(1rem,var(--safe-bottom))]'
            : 'bg-[#1f1414] border-t border-white/10 pb-[max(1rem,var(--safe-bottom))]',
          className
        )}
      >
        <div className="flex justify-center pt-2 pb-1 shrink-0" aria-hidden>
          <div className={cn('w-9 h-1 rounded-full', tone === 'light' ? 'bg-black/20' : 'bg-white/25')} />
        </div>
        {title && (
          <div className="flex items-center justify-between px-4 pb-3 shrink-0">
            <h2
              id="sheet-title"
              className={cn(
                'text-ios-title-3 font-semibold',
                tone === 'light' ? 'text-gray-900' : 'text-label-primary'
              )}
            >
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className={cn(
                'min-w-[44px] min-h-[44px] flex items-center justify-center rounded-[12px]',
                tone === 'light' ? 'text-gray-700 hover:bg-black/5 hover:text-gray-900' : 'text-label-secondary hover:bg-white/10'
              )}
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        <div className="overflow-y-auto px-4 flex-1">{children}</div>
        {footer && (
          <div
            className={cn(
              'px-4 pt-3 shrink-0',
              tone === 'light' ? 'border-t border-[rgba(60,60,67,0.12)]' : 'border-t border-white/10'
            )}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
}
