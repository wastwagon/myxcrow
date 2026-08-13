import { useEffect } from 'react';
import { cn } from '@/lib/utils';

export interface AlertDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
  tone?: 'dark' | 'light';
}

export function AlertDialog({
  open,
  title,
  message,
  confirmLabel = 'OK',
  cancelLabel = 'Cancel',
  destructive,
  onConfirm,
  onCancel,
  tone = 'dark',
}: AlertDialogProps) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onCancel();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onCancel]);

  if (!open) return null;

  const light = tone === 'light';

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-6">
      <button
        type="button"
        className="absolute inset-0 bg-black/55 backdrop-blur-sm"
        aria-label="Dismiss"
        onClick={onCancel}
      />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="alert-title"
        aria-describedby="alert-desc"
        className={cn(
          'relative z-10 w-full max-w-[20rem] rounded-[14px] overflow-hidden shadow-ios-card',
          light ? 'bg-white/92 backdrop-blur-xl' : 'bg-[#2a1c1e] border border-white/15'
        )}
      >
        <div className="px-4 pt-5 pb-3 text-center">
          <h2
            id="alert-title"
            className={cn('text-[17px] font-semibold', light ? 'text-gray-900' : 'text-label-primary')}
          >
            {title}
          </h2>
          <p
            id="alert-desc"
            className={cn('mt-2 text-[13px]', light ? 'text-[rgba(60,60,67,0.6)]' : 'text-label-secondary')}
          >
            {message}
          </p>
        </div>
        <div className={cn('flex flex-col', light ? 'border-t border-[rgba(60,60,67,0.18)]' : 'border-t border-white/10')}>
          <button
            type="button"
            onClick={onConfirm}
            className={cn(
              'min-h-[44px] w-full text-[17px] font-semibold touch-manipulation',
              light ? 'active:bg-[#d1d1d6]/40' : 'hover:bg-white/5 active:bg-white/10 transition-colors',
              destructive ? 'text-ios-destructive' : light ? 'text-brand-maroon' : 'text-brand-gold'
            )}
          >
            {confirmLabel}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className={cn(
              'min-h-[44px] w-full text-[17px] font-medium touch-manipulation',
              light
                ? 'border-t border-[rgba(60,60,67,0.18)] text-[rgba(60,60,67,0.6)] active:bg-[#d1d1d6]/40'
                : 'border-t border-white/10 text-label-secondary hover:bg-white/5 active:bg-white/10'
            )}
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
