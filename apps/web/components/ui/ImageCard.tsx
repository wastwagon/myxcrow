import Link from 'next/link';
import Image from 'next/image';
import type { LucideIcon } from 'lucide-react';
import { ArrowRight } from 'lucide-react';
import { cn } from '@/lib/utils';

interface ImageCardProps {
  href: string;
  title: string;
  description: string;
  image: string;
  icon?: LucideIcon;
  className?: string;
  /** Mobile carousel width class. Defaults to 72vw card. */
  mobileWidthClassName?: string;
  sizes?: string;
  priority?: boolean;
}

export function ImageCard({
  href,
  title,
  description,
  image,
  icon: Icon,
  className,
  mobileWidthClassName = 'w-[72vw] max-w-[270px]',
  sizes = '(max-width: 768px) 72vw, 33vw',
  priority,
}: ImageCardProps) {
  return (
    <Link
      href={href}
      className={cn(
        'group relative aspect-[3/4] shrink-0 snap-start overflow-hidden rounded-[1.25rem] border border-white/10 bg-black md:w-auto md:max-w-none',
        'v2-lift',
        mobileWidthClassName,
        className
      )}
    >
      <Image
        src={image}
        alt=""
        fill
        priority={priority}
        sizes={sizes}
        className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/25 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-4 md:p-5">
        {Icon && (
          <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full border border-white/15 bg-black/35 text-brand-gold backdrop-blur-sm">
            <Icon className="h-4 w-4" />
          </div>
        )}
        <div className="flex items-end justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-lg font-bold text-white leading-tight">{title}</h3>
            <p className="mt-0.5 text-xs text-white/85">{description}</p>
          </div>
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-brand-gold text-brand-maroon-black transition-transform group-hover:translate-x-0.5">
            <ArrowRight className="h-4 w-4" />
          </span>
        </div>
      </div>
    </Link>
  );
}

interface ImageCardRowProps {
  children: React.ReactNode;
  columns?: 2 | 3 | 4;
  className?: string;
}

export function ImageCardRow({ children, columns = 3, className }: ImageCardRowProps) {
  const gridCols =
    columns === 2 ? 'md:grid-cols-2' : columns === 4 ? 'md:grid-cols-4' : 'md:grid-cols-3';

  return (
    <div
      className={cn(
        '-mx-4 flex snap-x snap-mandatory gap-3 overflow-x-auto px-4 pb-2 [scrollbar-width:none]',
        'md:mx-0 md:grid md:overflow-visible md:px-0',
        '[&::-webkit-scrollbar]:hidden',
        gridCols,
        className
      )}
    >
      {children}
    </div>
  );
}
