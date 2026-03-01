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
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 md:p-8 mb-6">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-4 flex-1 min-w-0">
          {icon && (
            <div className="w-12 h-12 bg-brand-maroon/10 rounded-xl flex items-center justify-center flex-shrink-0 [&>svg]:text-brand-maroon [&>svg]:w-6 [&>svg]:h-6">
              {icon}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-1">{title}</h1>
            {subtitle && <p className="text-gray-600 text-base">{subtitle}</p>}
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




