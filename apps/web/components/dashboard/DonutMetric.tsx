import { cn } from '@/lib/utils';

interface DonutMetricProps {
  /** 0–1 share of the primary segment */
  ratio: number;
  size?: number;
  stroke?: number;
  className?: string;
  /** Primary ring color (CSS color) */
  color?: string;
  trackColor?: string;
}

/** Simple SVG donut — no chart library. */
export function DonutMetric({
  ratio,
  size = 72,
  stroke = 10,
  className,
  color = '#8f2126',
  trackColor = '#E5E7EB',
}: DonutMetricProps) {
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const clamped = Math.max(0, Math.min(1, ratio || 0));
  const offset = c * (1 - clamped);

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      className={cn('shrink-0 -rotate-90', className)}
      aria-hidden
    >
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={trackColor} strokeWidth={stroke} />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={r}
        fill="none"
        stroke={color}
        strokeWidth={stroke}
        strokeLinecap="round"
        strokeDasharray={c}
        strokeDashoffset={offset}
      />
    </svg>
  );
}
