import { type ReactNode } from 'react';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { admin } from '@/components/admin/adminClasses';

export interface ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footer?: ReactNode;
  className?: string;
}

/** Centered dark modal for desktop admin confirms / forms. */
export function Modal({ open, onClose, title, children, footer, className }: ModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-black/60 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={cn(admin.modalPanel, 'max-h-[90vh] overflow-y-auto', className)}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <h2 id="modal-title" className="text-ios-title-3 font-semibold text-label-primary">
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-[40px] min-w-[40px] items-center justify-center rounded-ios text-label-tertiary hover:bg-white/10 hover:text-label-primary touch-manipulation"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="text-label-secondary">{children}</div>
        {footer && <div className="mt-5 flex flex-wrap gap-2 justify-end">{footer}</div>}
      </div>
    </div>
  );
}
