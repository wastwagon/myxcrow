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
  tone?: 'dark' | 'light';
}

/** Centered modal for admin confirms / forms. */
export function Modal({
  open,
  onClose,
  title,
  children,
  footer,
  className,
  tone = 'light',
}: ModalProps) {
  if (!open) return null;
  const light = tone === 'light';

  return (
    <div className="fixed inset-0 z-[60] flex items-end sm:items-center justify-center p-4">
      <button
        type="button"
        aria-label="Close dialog"
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        onClick={onClose}
      />
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        className={cn(
          'relative z-10 w-full max-w-md max-h-[90vh] overflow-y-auto rounded-[20px] p-6',
          light
            ? 'bg-[#f2f2f7] text-gray-900'
            : cn(admin.modalPanel),
          className
        )}
      >
        <div className="flex items-start justify-between gap-3 mb-4">
          <h2
            id="modal-title"
            className={cn(
              'text-[20px] font-semibold',
              light ? 'text-gray-900' : 'text-label-primary'
            )}
          >
            {title}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className={cn(
              'inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-[12px] touch-manipulation',
              light
                ? 'text-gray-700 hover:bg-black/5 hover:text-gray-900'
                : 'text-label-tertiary hover:bg-white/10 hover:text-label-primary'
            )}
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className={light ? 'text-[15px] text-[rgba(60,60,67,0.6)]' : 'text-label-secondary'}>
          {children}
        </div>
        {footer && <div className="mt-5 flex flex-wrap gap-2 justify-end">{footer}</div>}
      </div>
    </div>
  );
}
