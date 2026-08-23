import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';

export interface HomeServiceTile {
  href: string;
  label: string;
  icon: LucideIcon;
}

export function HomeServiceGrid({ tiles }: { tiles: HomeServiceTile[] }) {
  return (
    <div className="grid grid-cols-3 gap-2.5">
      {tiles.map((tile) => {
        const Icon = tile.icon;
        return (
          <Link
            key={tile.href + tile.label}
            href={tile.href}
            className="flex min-h-[108px] flex-col items-center justify-center rounded-[16px] border border-[rgba(60,60,67,0.08)] bg-white px-1.5 py-4 text-center touch-manipulation active:bg-black/[0.03] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-gold focus-visible:ring-offset-2"
          >
            <Icon className="h-7 w-7 shrink-0 text-brand-maroon-deep" strokeWidth={1.75} aria-hidden />
            <span className="mt-2 line-clamp-2 text-[12px] font-medium leading-tight text-brand-maroon-deep">
              {tile.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
