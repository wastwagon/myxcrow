import Link from 'next/link';
import Image from 'next/image';
import { Twitter, Facebook, Linkedin, Instagram } from 'lucide-react';

const footerLinks = [
  { href: '/terms', label: 'Terms' },
  { href: '/privacy', label: 'Privacy' },
  { href: '/support', label: 'Support' },
];

// Social links - update hrefs when live
const socialLinks = [
  { href: process.env.NEXT_PUBLIC_TWITTER_URL || '#', icon: Twitter, label: 'Twitter' },
  { href: process.env.NEXT_PUBLIC_FACEBOOK_URL || '#', icon: Facebook, label: 'Facebook' },
  { href: process.env.NEXT_PUBLIC_LINKEDIN_URL || '#', icon: Linkedin, label: 'LinkedIn' },
  { href: process.env.NEXT_PUBLIC_INSTAGRAM_URL || '#', icon: Instagram, label: 'Instagram' },
];

export default function PremiumFooter() {
  return (
    <footer className="bg-brand-maroon-black border-t border-white/10">
      <div className="container mx-auto px-4 py-8 md:py-12">
        {/* Mobile: centered column, tight spacing */}
        <div className="flex flex-col items-center text-center md:flex-row md:items-center md:text-left gap-5 md:gap-4 md:justify-between">
          {/* Brand + nav: on mobile centered and stacked neatly */}
          <div className="flex flex-col items-center sm:flex-row sm:items-center gap-3 sm:gap-6 md:flex-1 md:justify-start md:flex-row">
            <Link href="/" className="flex items-center gap-2.5 group w-fit">
              <div className="w-9 h-9 md:w-10 md:h-10 rounded-lg md:rounded-xl flex items-center justify-center overflow-hidden bg-brand-maroon-deep/80 group-hover:opacity-90 transition-opacity shrink-0">
                <Image src="/logo/MYXCROWLOGO.png" alt="MYXCROW" width={40} height={40} className="object-contain w-full h-full" />
              </div>
              <span className="text-base md:text-lg font-bold text-white group-hover:text-brand-gold transition-colors">
                MYXCROW
              </span>
            </Link>
            <nav className="flex items-center justify-center gap-1 md:gap-4 flex-wrap">
              {footerLinks.map((link, i) => (
                <span key={link.href} className="flex items-center">
                  {i > 0 && <span className="text-white/40 mx-1.5 md:hidden" aria-hidden>·</span>}
                  <Link
                    href={link.href}
                    className="min-h-[44px] min-w-[44px] py-2 px-2 flex items-center justify-center text-xs md:text-sm text-white/80 hover:text-brand-gold transition-colors touch-manipulation"
                  >
                    {link.label}
                  </Link>
                </span>
              ))}
            </nav>
          </div>

          {/* Copyright: one line, compact on mobile */}
          <p className="text-xs md:text-sm text-white/55 md:flex-1 md:text-center px-2">
            © {new Date().getFullYear()} MYXCROW. Secure escrow for safe transactions.
          </p>

          {/* Socials: centered on mobile, compact spacing */}
          <div className="flex items-center justify-center gap-3 md:justify-end md:flex-1 md:gap-4">
            {socialLinks.map(({ href, icon: Icon, label }) => (
              <a
                key={label}
                href={href}
                target={href.startsWith('#') ? undefined : '_blank'}
                rel={href.startsWith('#') ? undefined : 'noopener noreferrer'}
                className="min-w-[40px] min-h-[40px] w-10 h-10 md:w-11 md:h-11 rounded-lg bg-white/10 flex items-center justify-center text-white/70 hover:bg-brand-gold hover:text-brand-maroon-black transition-all touch-manipulation"
                aria-label={label}
              >
                <Icon className="w-4 h-4 md:w-5 md:h-5" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
