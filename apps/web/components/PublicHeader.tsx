import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import { cn } from '@/lib/utils';
import { useConfirm } from '@/components/providers/UIProvider';
import { isPublicLightPath } from '@/lib/app-chrome';
import { isAuthenticated, logout } from '@/lib/auth';

const GUEST_LINKS = [
  { href: '/', label: 'Home' },
  { href: '/support', label: 'Support' },
  { href: '/login', label: 'Sign in' },
];

const AUTH_LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/help', label: 'Help' },
  { href: '/profile', label: 'Account' },
];

export default function PublicHeader() {
  const router = useRouter();
  const confirm = useConfirm();
  const light = isPublicLightPath(router.pathname, router.route);
  const [mounted, setMounted] = useState(false);
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    setMounted(true);
    setAuthenticated(isAuthenticated());
  }, [router.pathname]);

  const isActive = (href: string) =>
    router.pathname === href || (href !== '/' && router.pathname.startsWith(href));

  const quietNav = (active: boolean) =>
    cn(
      'inline-flex min-h-[44px] items-center px-3 rounded-[16px] font-semibold touch-manipulation',
      active
        ? light
          ? 'text-brand-maroon'
          : 'text-brand-gold'
        : light
          ? 'text-[rgba(60,60,67,0.75)] hover:text-gray-900'
          : 'text-white/85 hover:text-white hover:bg-white/10'
    );

  const handleSignOut = async () => {
    const ok = await confirm({
      title: 'Sign out',
      message: 'Sign out of this account?',
      confirmLabel: 'Sign out',
    });
    if (!ok) return;
    await logout();
    router.push('/login');
  };

  const navLinks = mounted && authenticated ? AUTH_LINKS : GUEST_LINKS;
  const registerBtnClass = cn(
    'inline-flex min-h-[40px] items-center px-3.5 rounded-[14px] text-[14px] font-semibold touch-manipulation',
    light
      ? 'bg-brand-maroon text-white hover:bg-brand-maroon-dark'
      : 'bg-brand-gold text-brand-maroon-black hover:bg-brand-gold/90'
  );
  const signInBtnClass = cn(
    'inline-flex min-h-[40px] items-center px-3 rounded-[14px] text-[14px] font-semibold touch-manipulation',
    light ? 'text-brand-maroon' : 'text-white/90'
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
          <Link href={mounted && authenticated ? '/dashboard' : '/'} className="flex min-h-[44px] items-center gap-3 group">
            <div className="relative flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-[16px] bg-brand-maroon-deep ring-1 ring-brand-gold/35 shadow-sm group-hover:scale-105 transition-transform">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo/MYXCROWLOGO.png" alt="MYXCROW" width={40} height={40} className="object-contain" />
            </div>
            <span
              className={cn(
                'text-[17px] font-semibold tracking-tight transition-colors',
                light ? 'text-gray-900 group-hover:text-brand-maroon' : 'text-white group-hover:text-brand-gold'
              )}
            >
              MYXCROW
            </span>
          </Link>

          <div className="flex items-center gap-1 md:hidden">
            {!mounted ? null : authenticated ? (
              <Link href="/dashboard" className={signInBtnClass}>
                Dashboard
              </Link>
            ) : (
              <>
                <Link href="/login" className={signInBtnClass}>
                  Sign in
                </Link>
                <Link href="/register" className={registerBtnClass}>
                  Register
                </Link>
              </>
            )}
          </div>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className={quietNav(isActive(link.href))}>
                {link.label}
              </Link>
            ))}
            {mounted && authenticated ? (
              <button
                type="button"
                onClick={handleSignOut}
                className={cn(
                  'ml-2 inline-flex min-h-[44px] items-center px-4 rounded-[16px] font-semibold touch-manipulation',
                  light
                    ? 'border border-brand-maroon/25 text-brand-maroon hover:bg-brand-maroon/5'
                    : 'border border-white/25 text-white hover:bg-white/10'
                )}
              >
                Sign out
              </button>
            ) : (
              <Link
                href="/register"
                className={cn(
                  'ml-2 inline-flex min-h-[44px] items-center px-4 rounded-[16px] font-semibold touch-manipulation',
                  light
                    ? 'bg-brand-maroon text-white hover:bg-brand-maroon-dark'
                    : 'bg-brand-gold text-brand-maroon-black hover:bg-brand-gold/90'
                )}
              >
                Register
              </Link>
            )}
          </nav>
        </div>
      </div>
    </header>
  );
}
