import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TabBarItem {
  href: string;
  label: string;
  icon: LucideIcon;
  isActive: boolean;
}

interface TabBarProps {
  items: TabBarItem[];
  className?: string;
}

export function TabBar({ items, className }: TabBarProps) {
  return (
    <nav
      className={cn(
        'fixed bottom-0 left-0 right-0 z-50 xl:hidden',
        'bg-[var(--tab-bar-bg)] backdrop-blur-ios border-t border-white/10 shadow-tab-bar',
        className
      )}
      style={{ paddingBottom: 'var(--safe-bottom)' }}
      aria-label="Main"
    >
      <div className="flex items-stretch h-tab-bar max-w-lg mx-auto">
        {items.map((item) => {
          const Icon = item.icon;
          return (
            <Link
              key={item.href + item.label}
              href={item.href}
              className={cn(
                'flex flex-1 flex-col items-center justify-center min-w-0 py-1.5 px-0.5',
                'touch-manipulation transition-colors',
                item.isActive ? 'text-brand-gold' : 'text-white/50 hover:text-white/75'
              )}
              aria-current={item.isActive ? 'page' : undefined}
            >
              <Icon
                className="shrink-0"
                size={22}
                strokeWidth={item.isActive ? 2.5 : 2}
                aria-hidden
              />
              <span className="text-[10px] font-medium mt-0.5 truncate max-w-full px-0.5">
                {item.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
