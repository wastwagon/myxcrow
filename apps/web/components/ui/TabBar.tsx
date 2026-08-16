import Link from 'next/link';
import { useRouter } from 'next/router';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface TabBarItem {
  href: string;
  label: string;
  icon: LucideIcon;
  isActive: boolean;
  badge?: number;
}

interface TabBarProps {
  items: TabBarItem[];
  className?: string;
  tone?: 'dark' | 'ios';
}

export function TabBar({ items, className, tone = 'dark' }: TabBarProps) {
  const router = useRouter();
  const ios = tone === 'ios';

  const onTabClick = (e: React.MouseEvent<HTMLAnchorElement>, item: TabBarItem) => {
    if (!item.isActive) return;
    e.preventDefault();
    const atRoot = router.pathname === item.href;
    if (atRoot) {
      const scroller = document.getElementById('customer-scroll');
      if (scroller) scroller.scrollTo({ top: 0, behavior: 'smooth' });
      else window.scrollTo({ top: 0, behavior: 'smooth' });
    } else {
      void router.push(item.href);
    }
  };

  const tabs = items.map((item) => {
    const Icon = item.icon;
    return (
      <Link
        key={item.href + item.label}
        href={item.href}
        onClick={(e) => onTabClick(e, item)}
        className={cn(
          'relative flex flex-1 flex-col items-center justify-center min-w-0 px-0.5',
          'touch-manipulation transition-colors duration-200',
          ios
            ? item.isActive
              ? 'text-brand-maroon'
              : 'text-[rgba(60,60,67,0.6)]'
            : item.isActive
              ? 'text-brand-gold'
              : 'text-white/50 hover:text-white/75'
        )}
        aria-current={item.isActive ? 'page' : undefined}
      >
        <span className="relative">
          <Icon
            className="shrink-0"
            size={ios ? 26 : 22}
            strokeWidth={item.isActive ? 2.2 : 1.75}
            fill={item.isActive ? 'currentColor' : 'none'}
            aria-hidden
          />
          {item.badge != null && item.badge > 0 && (
            <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-[#ff3b30] text-white text-[10px] font-semibold leading-4 text-center">
              {item.badge > 99 ? '99+' : item.badge}
            </span>
          )}
        </span>
        <span className="font-medium mt-0.5 truncate max-w-full px-0.5 text-[10px]">{item.label}</span>
      </Link>
    );
  });

  if (ios) {
    return (
      <nav
        className={cn('fixed bottom-0 left-0 right-0 z-50 xl:hidden pointer-events-none', className)}
        style={{ padding: '8px 16px max(10px, var(--safe-bottom))' }}
        aria-label="Main"
      >
        <div
          className="pointer-events-auto flex items-stretch h-[52px] max-w-lg mx-auto rounded-[26px]"
          style={{
            background: 'rgba(255,255,255,0.78)',
            backdropFilter: 'blur(40px) saturate(1.8)',
            WebkitBackdropFilter: 'blur(40px) saturate(1.8)',
            boxShadow:
              '0 10px 40px rgba(0,0,0,0.14), 0 0.5px 0 rgba(255,255,255,0.8) inset, 0 0 0 0.5px rgba(0,0,0,0.06)',
          }}
        >
          {tabs}
        </div>
      </nav>
    );
  }

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
      <div className="flex items-stretch max-w-lg mx-auto h-tab-bar">{tabs}</div>
    </nav>
  );
}
