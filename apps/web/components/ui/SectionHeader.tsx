import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  title: string;
  eyebrow?: string;
  href?: string;
  linkLabel?: string;
  className?: string;
  tone?: 'dark' | 'light';
}

export function SectionHeader({
  title,
  eyebrow,
  href,
  linkLabel = 'View all',
  className,
  tone = 'dark',
}: SectionHeaderProps) {
  const light = tone === 'light';
  return (
    <div className={cn('mb-3 flex items-end justify-between gap-3 px-1', className)}>
      <div>
        {eyebrow && (
          <p
            className={cn(
              'text-xs font-semibold uppercase tracking-[0.14em]',
              light ? 'text-brand-maroon' : 'text-brand-gold/75'
            )}
          >
            {eyebrow}
          </p>
        )}
        <h2
          className={cn(
            'text-[17px] font-semibold tracking-tight',
            light ? 'text-gray-900' : 'text-white',
            eyebrow && 'mt-1'
          )}
        >
          {title}
        </h2>
      </div>
      {href && (
        <Link
          href={href}
          className={cn(
            'inline-flex min-h-[44px] items-center gap-1 text-[15px] font-semibold touch-manipulation',
            light ? 'text-brand-maroon' : 'text-brand-gold'
          )}
        >
          {linkLabel} <ArrowRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}
