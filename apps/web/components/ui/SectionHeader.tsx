import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface SectionHeaderProps {
  title: string;
  eyebrow?: string;
  href?: string;
  linkLabel?: string;
  className?: string;
}

export function SectionHeader({
  title,
  eyebrow,
  href,
  linkLabel = 'View all',
  className,
}: SectionHeaderProps) {
  return (
    <div className={cn('mb-3 flex items-end justify-between gap-3 px-1', className)}>
      <div>
        {eyebrow && (
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-gold/75">
            {eyebrow}
          </p>
        )}
        <h2 className={cn('text-xl font-bold tracking-tight text-white', eyebrow && 'mt-1')}>
          {title}
        </h2>
      </div>
      {href && (
        <Link href={href} className="flex items-center gap-1 text-xs font-semibold text-brand-gold">
          {linkLabel} <ArrowRight className="w-4 h-4" />
        </Link>
      )}
    </div>
  );
}
