import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';
import { isPublicLightPath } from '@/lib/app-chrome';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/login', label: 'Sign In' },
  { href: '/register', label: 'Register' },
];

export default function PublicHeader() {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const light = isPublicLightPath(router.pathname, router.route);

  const isActive = (href: string) =>
    router.pathname === href || (href !== '/' && router.pathname.startsWith(href));

  const navClass = (active: boolean) =>
    cn(
      'flex min-h-[48px] items-center px-4 rounded-[10px] font-semibold touch-manipulation',
      active
        ? light
          ? 'text-brand-maroon'
          : 'bg-brand-gold text-brand-maroon-black'
        : light
          ? 'text-[rgba(60,60,67,0.6)] active:bg-black/5'
          : 'text-label-secondary hover:bg-white/10 hover:text-label-primary'
    );

  return (
    <header
      className={cn(
        'sticky top-0 z-50 w-full pt-safe',
        light
          ? 'bg-[#f2f2f7]'
          : 'bg-[var(--app-chrome-bg)] border-b border-white/10 shadow-tab-bar'
      )}
      style={light ? { boxShadow: 'inset 0 -0.5px 0 rgba(60,60,67,0.29)' } : undefined}
    >
      <div className="container mx-auto px-4">
        <div className="flex h-14 md:h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group" onClick={() => setOpen(false)}>
            <div className="relative flex h-9 w-9 md:h-10 md:w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-brand-maroon-deep ring-1 ring-brand-gold/35 shadow-sm group-hover:scale-105 transition-transform">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo/MYXCROWLOGO.png" alt="MYXCROW" width={40} height={40} className="object-contain" />
            </div>
            <span
              className={cn(
                'hidden text-lg font-bold tracking-tight sm:inline md:text-xl transition-colors',
                light ? 'text-gray-900 group-hover:text-brand-maroon' : 'text-label-primary group-hover:text-brand-gold'
              )}
            >
              MYXCROW
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'inline-flex min-h-[44px] items-center px-4 rounded-ios-lg font-semibold transition-all',
                  isActive(link.href)
                    ? light
                      ? 'text-brand-maroon'
                      : 'bg-brand-gold text-brand-maroon-black shadow-sm'
                    : light
                      ? 'text-[rgba(60,60,67,0.6)] hover:text-gray-900'
                      : 'text-label-secondary hover:bg-white/10 hover:text-label-primary'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <button
            type="button"
            className={cn(
              'md:hidden inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-[10px] touch-manipulation',
              light
                ? 'text-[rgba(60,60,67,0.6)] hover:bg-black/5 hover:text-gray-900'
                : 'text-label-secondary hover:bg-white/10 hover:text-label-primary'
            )}
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {open && (
          <nav
            className={cn(
              'md:hidden py-3 space-y-1',
              light ? 'border-t border-[rgba(60,60,67,0.12)]' : 'border-t border-white/10'
            )}
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={navClass(isActive(link.href))}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/support"
              onClick={() => setOpen(false)}
              className={navClass(router.pathname === '/support')}
            >
              Support
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
