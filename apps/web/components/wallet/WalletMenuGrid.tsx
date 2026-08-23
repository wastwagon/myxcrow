import Link from 'next/link';
import type { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { IconWell, type IconWellColor } from '@/components/ui/IconWell';

export interface WalletMenuTile {
  href?: string;
  onClick?: () => void;
  label: string;
  subtitle?: string;
  icon: LucideIcon;
  color: IconWellColor;
  destructive?: boolean;
}

export function WalletMenuGrid({ tiles }: { tiles: WalletMenuTile[] }) {
  return (
    <div className="grid grid-cols-3 gap-2.5">
      {tiles.map((tile) => {
        const Icon = tile.icon;
        const className = cn(
          'flex min-h-[118px] flex-col items-center justify-center rounded-[16px] border bg-white px-2 py-4 text-center touch-manipulation',
          tile.destructive
            ? 'border-red-200/80 active:bg-red-50'
            : 'border-[rgba(60,60,67,0.08)] active:bg-black/[0.03]'
        );
        const content = (
          <>
            <IconWell icon={Icon} color={tile.color} className="h-11 w-11 rounded-[14px]" />
            <span
              className={cn(
                'mt-2.5 text-[12px] font-semibold leading-tight',
                tile.destructive ? 'text-red-600' : 'text-brand-maroon-deep'
              )}
            >
              {tile.label}
            </span>
            {tile.subtitle && (
              <span className="mt-0.5 text-[10px] leading-tight text-[rgba(60,60,67,0.5)]">
                {tile.subtitle}
              </span>
            )}
          </>
        );

        if (tile.onClick) {
          return (
            <button key={tile.label} type="button" onClick={tile.onClick} className={className}>
              {content}
            </button>
          );
        }

        return (
          <Link key={tile.label} href={tile.href!} className={className}>
            {content}
          </Link>
        );
      })}
    </div>
  );
}
