import {
  useEffect,
  useId,
  useRef,
  useState,
  type ReactNode,
  type ButtonHTMLAttributes,
} from 'react';
import Link from 'next/link';
import { MoreHorizontal } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface DropdownItem {
  id: string;
  label: string;
  icon?: ReactNode;
  onClick?: () => void;
  href?: string;
  disabled?: boolean;
  destructive?: boolean;
}

interface DropdownMenuProps {
  items: DropdownItem[];
  label?: string;
  align?: 'left' | 'right';
  triggerClassName?: string;
  triggerProps?: ButtonHTMLAttributes<HTMLButtonElement>;
  tone?: 'dark' | 'light';
}

export function DropdownMenu({
  items,
  label = 'Actions',
  align = 'right',
  triggerClassName,
  triggerProps,
  tone = 'light',
}: DropdownMenuProps) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();
  const light = tone === 'light';

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDoc);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return (
    <div className="relative inline-flex" ref={rootRef}>
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-controls={menuId}
        aria-label={label}
        onClick={() => setOpen((v) => !v)}
        className={cn(
          'inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-[16px]',
          'transition-colors touch-manipulation',
          light
            ? 'text-gray-700 hover:bg-black/5 hover:text-gray-900'
            : 'text-label-secondary hover:bg-white/10 hover:text-label-primary',
          triggerClassName
        )}
        {...triggerProps}
      >
        <MoreHorizontal className="w-5 h-5" />
      </button>
      {open && (
        <div
          id={menuId}
          role="menu"
          className={cn(
            'absolute z-50 mt-1 min-w-[200px] py-1 rounded-[16px] overflow-hidden',
            light
              ? 'bg-white border border-[rgba(60,60,67,0.12)]'
              : 'border border-white/15 bg-[#261819] shadow-ios-card',
            align === 'right' ? 'right-0' : 'left-0'
          )}
        >
          {items.map((item) => {
            const className = cn(
              'flex w-full min-h-[44px] items-center gap-2 px-3 text-[17px] font-normal transition-colors text-left',
              item.disabled && 'opacity-40 pointer-events-none',
              item.destructive
                ? light
                  ? 'text-[#ff3b30] hover:bg-red-50'
                  : 'text-red-300 hover:bg-red-500/15'
                : light
                  ? 'text-gray-900 hover:bg-black/[0.04]'
                  : 'text-label-secondary hover:bg-white/10 hover:text-label-primary'
            );

            if (item.href) {
              return (
                <Link
                  key={item.id}
                  href={item.href}
                  role="menuitem"
                  className={className}
                  onClick={() => setOpen(false)}
                >
                  {item.icon}
                  {item.label}
                </Link>
              );
            }

            return (
              <button
                key={item.id}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                className={className}
                onClick={() => {
                  setOpen(false);
                  item.onClick?.();
                }}
              >
                {item.icon}
                {item.label}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
