import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';

export function FormSection({
  title,
  description,
  children,
  first,
  className,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  first?: boolean;
  className?: string;
}) {
  return (
    <section
      className={cn(
        'space-y-4',
        !first && 'border-t border-[rgba(60,60,67,0.12)] pt-6',
        className
      )}
    >
      <div>
        <h3 className="text-[15px] font-semibold text-gray-900">{title}</h3>
        {description && (
          <p className="mt-1 text-[13px] leading-relaxed text-[rgba(60,60,67,0.55)]">
            {description}
          </p>
        )}
      </div>
      <div className="space-y-4">{children}</div>
    </section>
  );
}
