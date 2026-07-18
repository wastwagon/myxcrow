import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/login', label: 'Sign In' },
  { href: '/register', label: 'Register' },
];

export default function PublicHeader() {
  const router = useRouter();
  const [open, setOpen] = useState(false);

  const isActive = (href: string) =>
    router.pathname === href || (href !== '/' && router.pathname.startsWith(href));

  return (
    <header className="sticky top-0 z-50 w-full border-b border-brand-gold/10 bg-[var(--nav-bar-bg)] backdrop-blur-ios shadow-lg shadow-black/20 pt-safe">
      <div className="container mx-auto px-4">
        <div className="flex h-14 md:h-16 items-center justify-between">
          <Link href="/" className="flex items-center gap-3 group" onClick={() => setOpen(false)}>
            <div className="relative flex h-9 w-9 md:h-10 md:w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-brand-maroon-deep ring-1 ring-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo/MYXCROWLOGO.png" alt="MYXCROW" width={40} height={40} className="object-contain" />
            </div>
            <span className="hidden text-lg font-bold text-white transition-colors group-hover:text-brand-gold sm:inline md:text-xl">
              MYXCROW
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  'inline-flex min-h-[44px] items-center px-4 rounded-ios-lg font-medium transition-all',
                  isActive(link.href)
                    ? 'bg-brand-gold text-brand-maroon-black'
                    : 'text-white/90 hover:bg-white/10 hover:text-brand-gold'
                )}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <button
            type="button"
            className="md:hidden inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-ios-lg text-white/90 hover:bg-white/10 touch-manipulation"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {open && (
          <nav className="md:hidden border-t border-white/10 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setOpen(false)}
                className={cn(
                  'flex min-h-[48px] items-center px-4 rounded-ios-lg font-medium touch-manipulation',
                  isActive(link.href)
                    ? 'bg-brand-gold text-brand-maroon-black'
                    : 'text-white/90 hover:bg-white/10'
                )}
              >
                {link.label}
              </Link>
            ))}
            <Link
              href="/support"
              onClick={() => setOpen(false)}
              className="flex min-h-[48px] items-center px-4 rounded-ios-lg font-medium text-white/90 hover:bg-white/10 touch-manipulation"
            >
              Support
            </Link>
          </nav>
        )}
      </div>
    </header>
  );
}
