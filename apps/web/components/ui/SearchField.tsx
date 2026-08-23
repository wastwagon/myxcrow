import { Search, X } from 'lucide-react';
import { cn } from '@/lib/utils';

export function SearchField({
  value,
  onChange,
  placeholder = 'Search',
  className,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}) {
  return (
    <div
      className={cn(
        'flex min-h-[52px] items-center gap-3 rounded-[16px] border border-[rgba(60,60,67,0.08)] bg-white px-3.5',
        'transition-[border-color,box-shadow] focus-within:border-brand-gold/45 focus-within:ring-1 focus-within:ring-brand-gold/25',
        className
      )}
    >
      <span
        className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[12px] bg-brand-maroon/8 text-brand-maroon-deep"
        aria-hidden
      >
        <Search className="h-[18px] w-[18px]" strokeWidth={2.1} />
      </span>
      <input
        type="search"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="min-w-0 flex-1 bg-transparent py-3 text-[17px] text-gray-900 placeholder:text-[rgba(60,60,67,0.45)] outline-none"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange('')}
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-[rgba(60,60,67,0.55)] hover:bg-black/[0.04] touch-manipulation"
          aria-label="Clear search"
        >
          <X className="h-4 w-4" strokeWidth={2.2} />
        </button>
      ) : null}
    </div>
  );
}
