import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';

export function BrandMark({
  href = '/dashboard',
  tone = 'light',
}: {
  href?: string;
  tone?: 'light' | 'onMaroon';
}) {
  const onMaroon = tone === 'onMaroon';
  return (
    <Link
      href={href}
      className="inline-flex min-h-[44px] items-center gap-3 group touch-manipulation"
    >
      <div className="relative flex h-11 w-11 shrink-0 items-center justify-center overflow-hidden rounded-[16px] bg-brand-maroon-deep ring-1 ring-brand-gold/35">
        <Image
          src="/logo/MYXCROWLOGO.png"
          alt=""
          width={40}
          height={40}
          className="object-contain"
          priority
        />
      </div>
      <span
        className={cn(
          'text-[17px] font-semibold tracking-tight',
          onMaroon ? 'text-white' : 'text-gray-900 group-hover:text-brand-maroon'
        )}
      >
        MYXCROW
      </span>
    </Link>
  );
}
