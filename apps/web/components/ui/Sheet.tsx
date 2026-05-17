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
}

export function Sheet({ open, onClose, title, children, footer, className }: SheetProps) {
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
          'relative z-10 w-full max-h-[90vh] flex flex-col',
          'bg-[#1f1414] border-t border-white/10 rounded-t-ios-xl shadow-2xl',
          'pb-[max(1rem,var(--safe-bottom))]',
          className
        )}
      >
        <div className="flex justify-center pt-2 pb-1 shrink-0" aria-hidden>
          <div className="w-9 h-1 rounded-full bg-white/25" />
        </div>
        {title && (
          <div className="flex items-center justify-between px-4 pb-3 shrink-0">
            <h2 id="sheet-title" className="text-ios-title-3 text-label-primary font-semibold">
              {title}
            </h2>
            <button
              type="button"
              onClick={onClose}
              className="min-w-[44px] min-h-[44px] flex items-center justify-center rounded-ios text-label-secondary hover:bg-white/10"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        )}
        <div className="overflow-y-auto px-4 flex-1">{children}</div>
        {footer && <div className="px-4 pt-3 shrink-0 border-t border-white/10">{footer}</div>}
      </div>
    </div>
  );
}
