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
  /** Raised gold center action (New escrow). */
  raised?: boolean;
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
    if (item.raised) {
      return (
        <Link
          key={item.href + item.label}
          href={item.href}
          onClick={(e) => onTabClick(e, item)}
          className="relative flex flex-1 flex-col items-center justify-end min-w-0 px-0.5 pb-1 touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2 rounded-[16px]"
          aria-label={item.label}
          aria-current={item.isActive ? 'page' : undefined}
        >
          <span
            className={cn(
              'absolute -top-7 z-10 flex h-14 w-14 items-center justify-center rounded-full bg-brand-gold text-brand-maroon-black',
              item.isActive && 'ring-2 ring-brand-maroon/25'
            )}
          >
            <Icon size={26} strokeWidth={2.4} aria-hidden />
          </span>
          <span className="font-medium truncate max-w-full px-0.5 text-[10px] tracking-tight text-brand-maroon">
            {item.label}
          </span>
        </Link>
      );
    }

    return (
      <Link
        key={item.href + item.label}
        href={item.href}
        onClick={(e) => onTabClick(e, item)}
        className={cn(
          'relative flex flex-1 flex-col items-center justify-center min-w-0 px-0.5',
          'touch-manipulation transition-colors duration-200',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2',
          ios
            ? item.isActive
              ? 'text-brand-maroon'
              : 'text-[rgba(60,60,67,0.55)]'
            : item.isActive
              ? 'text-brand-gold'
              : 'text-white/50 hover:text-white/75'
        )}
        aria-current={item.isActive ? 'page' : undefined}
      >
        <span className="relative">
          <Icon
            className="shrink-0"
            size={26}
            strokeWidth={item.isActive ? 2.35 : 1.7}
            fill={item.isActive ? 'currentColor' : 'none'}
            aria-hidden
          />
          {item.badge != null && item.badge > 0 && (
            <span className="absolute -top-1 -right-2 min-w-[16px] h-4 px-1 rounded-full bg-[#ff3b30] text-white text-[10px] font-semibold leading-4 text-center">
              {item.badge > 99 ? '99+' : item.badge}
            </span>
          )}
        </span>
        <span className="font-medium mt-0.5 truncate max-w-full px-0.5 text-[10px] tracking-tight">
          {item.label}
        </span>
      </Link>
    );
  });

  return (
    <nav
      className={cn('fixed bottom-0 left-0 right-0 z-50 xl:hidden pointer-events-none overflow-visible', className)}
      style={{ padding: '8px 16px max(12px, var(--safe-bottom))' }}
      aria-label="Main"
    >
      <div
        className="pointer-events-auto relative flex items-stretch h-[54px] max-w-lg mx-auto rounded-[28px] overflow-visible"
        style={
          ios
            ? {
                background: 'rgba(255,255,255,0.82)',
                backdropFilter: 'blur(40px) saturate(1.9)',
                WebkitBackdropFilter: 'blur(40px) saturate(1.9)',
                boxShadow:
                  '0 12px 40px rgba(0,0,0,0.12), 0 0.5px 0 rgba(255,255,255,0.9) inset, 0 0 0 0.5px rgba(0,0,0,0.04)',
              }
            : {
                background: 'rgba(22,15,16,0.78)',
                backdropFilter: 'blur(40px) saturate(1.8)',
                WebkitBackdropFilter: 'blur(40px) saturate(1.8)',
                boxShadow:
                  '0 12px 40px rgba(0,0,0,0.35), 0 0.5px 0 rgba(255,255,255,0.12) inset, 0 0 0 0.5px rgba(255,255,255,0.08)',
              }
        }
      >
        {tabs}
      </div>
    </nav>
  );
}
