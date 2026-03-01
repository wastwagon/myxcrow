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
    <footer className="bg-brand-maroon-black border-t border-brand-maroon-deep/50">
      <div className="container mx-auto px-4 py-10 md:py-12">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-8">
          {/* Brand */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 sm:gap-6">
            <Link href="/" className="flex items-center gap-3 group w-fit">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden bg-brand-maroon-deep group-hover:opacity-90 transition-opacity">
                <Image src="/logo/MYXCROWLOGO.png" alt="MYXCROW" width={40} height={40} className="object-contain" />
              </div>
              <span className="text-lg font-bold text-white group-hover:text-brand-gold transition-colors">
                MYXCROW
              </span>
            </Link>
            <nav className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
              {footerLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-white/80 hover:text-brand-gold transition-colors"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Socials */}
          <div className="flex items-center gap-4">
            {socialLinks.map(({ href, icon: Icon, label }) => (
              <a
                key={label}
                href={href}
                target={href.startsWith('#') ? undefined : '_blank'}
                rel={href.startsWith('#') ? undefined : 'noopener noreferrer'}
                className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center text-white/80 hover:bg-brand-gold hover:text-brand-maroon-black transition-all"
                aria-label={label}
              >
                <Icon className="w-5 h-5" />
              </a>
            ))}
          </div>
        </div>
        <p className="mt-6 text-center md:text-left text-sm text-white/60">
          © {new Date().getFullYear()} MYXCROW. Secure escrow services for safe transactions.
        </p>
      </div>
    </footer>
  );
}
