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
    <div className="bg-white/[0.07] backdrop-blur-sm rounded-xl border border-white/10 p-6 md:p-8 mb-6 shadow-xl shadow-black/10">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          {icon && (
            <div className="w-12 h-12 bg-brand-gold/20 rounded-xl flex items-center justify-center flex-shrink-0 [&>svg]:text-brand-gold [&>svg]:w-6 [&>svg]:h-6 ring-1 ring-brand-gold/30">
              {icon}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold text-white mb-1 tracking-tight">{title}</h1>
            {subtitle && <p className="text-white/80 text-base">{subtitle}</p>}
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




