import { cn } from '@/lib/utils';

export interface BarSeries {
  key: string;
  label: string;
  color: string;
}

export interface BarPoint {
  label: string;
  values: Record<string, number>;
}

interface SimpleBarChartProps {
  data: BarPoint[];
  series: BarSeries[];
  height?: number;
  className?: string;
}

/** Stacked bar chart with CSS — works without recharts. */
export function SimpleBarChart({ data, series, height = 200, className }: SimpleBarChartProps) {
  const max = Math.max(
    1,
    ...data.map((d) => series.reduce((sum, s) => sum + (d.values[s.key] || 0), 0))
  );

  return (
    <div className={cn('w-full', className)}>
      <div className="flex items-end gap-1.5 sm:gap-2.5" style={{ height }}>
        {data.map((point) => {
          const total = series.reduce((sum, s) => sum + (point.values[s.key] || 0), 0);
          const barH = Math.max(4, Math.round((total / max) * height));
          return (
            <div key={point.label} className="flex-1 flex flex-col items-center gap-2 min-w-0 h-full justify-end">
              <div
                className="w-full max-w-[36px] mx-auto flex flex-col-reverse rounded-t-md overflow-hidden"
                style={{ height: barH }}
                title={`${point.label}: ${total}`}
              >
                {series.map((s) => {
                  const v = point.values[s.key] || 0;
                  if (!v) return null;
                  const segH = `${(v / total) * 100}%`;
                  return (
                    <div
                      key={s.key}
                      style={{ height: segH, backgroundColor: s.color }}
                      className="w-full min-h-[2px]"
                    />
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
      <div className="mt-2 flex gap-1.5 sm:gap-2.5">
        {data.map((point) => (
          <div key={point.label} className="flex-1 text-center text-[10px] sm:text-xs text-gray-500 truncate">
            {point.label}
          </div>
        ))}
      </div>
      {series.length > 1 && (
        <div className="mt-3 flex flex-wrap gap-3">
          {series.map((s) => (
            <div key={s.key} className="inline-flex items-center gap-1.5 text-xs text-gray-600">
              <span className="h-2 w-2 rounded-sm" style={{ backgroundColor: s.color }} />
              {s.label}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
