import Link from 'next/link';
import { useRouter } from 'next/router';
import { cn } from '@/lib/utils';
import { isPublicLightPath } from '@/lib/app-chrome';

const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/support', label: 'Support' },
  { href: '/login', label: 'Sign in' },
];

export default function PublicHeader() {
  const router = useRouter();
  const light = isPublicLightPath(router.pathname, router.route);

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
          <Link href="/" className="flex min-h-[44px] items-center gap-3 group">
            <div className="relative flex h-11 w-11 flex-shrink-0 items-center justify-center overflow-hidden rounded-[16px] bg-brand-maroon-deep ring-1 ring-brand-gold/35 shadow-sm group-hover:scale-105 transition-transform">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo/MYXCROWLOGO.png" alt="MYXCROW" width={40} height={40} className="object-contain" />
            </div>
            <span
              className={cn(
                'text-lg font-bold tracking-tight md:text-xl transition-colors',
                light ? 'text-gray-900 group-hover:text-brand-maroon' : 'text-white group-hover:text-brand-gold'
              )}
            >
              MYXCROW
            </span>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href} className={quietNav(isActive(link.href))}>
                {link.label}
              </Link>
            ))}
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
          </nav>
        </div>
      </div>
    </header>
  );
}
