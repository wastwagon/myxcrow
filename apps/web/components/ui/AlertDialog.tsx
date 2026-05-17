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
          'relative z-10 w-full max-w-[20rem] rounded-ios-xl overflow-hidden',
          'bg-[#2a1c1e] border border-white/15 shadow-ios-card'
        )}
      >
        <div className="px-4 pt-5 pb-3 text-center">
          <h2 id="alert-title" className="text-ios-headline font-semibold text-label-primary">
            {title}
          </h2>
          <p id="alert-desc" className="mt-2 text-ios-subhead text-label-secondary">
            {message}
          </p>
        </div>
        <div className="border-t border-white/10 flex flex-col">
          <button
            type="button"
            onClick={onConfirm}
            className={cn(
              'min-h-[44px] w-full text-ios-body font-semibold touch-manipulation',
              'hover:bg-white/5 active:bg-white/10 transition-colors',
              destructive ? 'text-ios-destructive' : 'text-brand-gold'
            )}
          >
            {confirmLabel}
          </button>
          <button
            type="button"
            onClick={onCancel}
            className="min-h-[44px] w-full border-t border-white/10 text-ios-body font-medium text-label-secondary hover:bg-white/5 active:bg-white/10 touch-manipulation"
          >
            {cancelLabel}
          </button>
        </div>
      </div>
    </div>
  );
}
