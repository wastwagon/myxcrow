import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
  gradient?: 'brand' | 'gold' | 'maroon' | 'green' | 'red' | 'yellow' | 'blue' | 'purple';
}

export default function PageHeader({ title, subtitle, icon, action, gradient = 'brand' }: PageHeaderProps) {
  return (
    <div className="bg-white/[0.07] backdrop-blur-sm rounded-xl border border-white/10 p-4 md:p-5 shadow-lg shadow-black/10">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          {icon && (
            <div className="w-10 h-10 bg-brand-gold/20 rounded-lg flex items-center justify-center flex-shrink-0 [&>svg]:text-brand-gold [&>svg]:w-5 [&>svg]:h-5 ring-1 ring-brand-gold/30">
              {icon}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-xl md:text-2xl font-bold text-white tracking-tight">{title}</h1>
            {subtitle && <p className="text-white/70 text-sm mt-0.5">{subtitle}</p>}
          </div>
        </div>
        {action && (
          <div className="flex-shrink-0 [&_a]:min-h-[48px] [&_a]:flex [&_a]:items-center [&_button]:min-h-[48px] [&_button]:flex [&_button]:items-center touch-manipulation">
            {action}
          </div>
        )}
      </div>
    </div>
  );
}




