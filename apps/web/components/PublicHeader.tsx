import Link from 'next/link';
import { useRouter } from 'next/router';

// Primary CTAs only - Terms, Privacy, Support moved to footer
const navLinks = [
  { href: '/', label: 'Home' },
  { href: '/login', label: 'Sign In' },
  { href: '/register', label: 'Register' },
];

export default function PublicHeader() {
  const router = useRouter();

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[var(--nav-bar-bg)] backdrop-blur-ios shadow-lg shadow-black/20 pt-safe">
      <div className="container mx-auto px-4">
        <div className="flex h-14 md:h-16 items-center justify-between">
          {/* Logo & Brand */}
          <Link href="/" className="flex items-center gap-3 group">
            <div className="relative flex h-9 w-9 md:h-10 md:w-10 flex-shrink-0 items-center justify-center overflow-hidden rounded-xl bg-brand-maroon-deep ring-1 ring-white/10">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/logo/MYXCROWLOGO.png" alt="MYXCROW" width={40} height={40} className="object-contain" />
            </div>
            <span className="hidden text-lg font-bold text-white transition-colors group-hover:text-brand-gold sm:inline md:text-xl">
              MYXCROW
            </span>
          </Link>

          {/* Desktop only - mobile uses bottom nav */}
          <nav className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => {
              const isActive =
                router.pathname === link.href ||
                (link.href !== '/' && router.pathname.startsWith(link.href));
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`px-4 py-2 rounded-lg font-medium transition-all ${
                    isActive
                      ? 'bg-brand-gold text-brand-maroon-black'
                      : 'text-white/90 hover:bg-white/10 hover:text-brand-gold'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>
    </header>
  );
}
