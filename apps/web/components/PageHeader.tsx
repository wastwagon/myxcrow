import { ReactNode } from 'react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
  gradient?: 'brand' | 'gold' | 'maroon' | 'green' | 'red' | 'yellow' | 'blue' | 'purple';
}

export default function PageHeader({ title, subtitle, icon, action, gradient = 'brand' }: PageHeaderProps) {
  const gradientClasses: Record<string, string> = {
    brand: 'from-brand-maroon via-brand-maroon-dark to-brand-maroon-darker',
    gold: 'from-brand-gold to-primary-600',
    maroon: 'from-brand-maroon to-brand-maroon-darker',
    green: 'from-brand-maroon-dark to-brand-maroon-darker',
    red: 'from-brand-maroon-rust to-brand-maroon',
    yellow: 'from-brand-gold to-primary-500',
    blue: 'from-brand-maroon via-brand-maroon-dark to-brand-maroon-darker',
    purple: 'from-brand-maroon-dark to-brand-maroon-darker',
  };

  return (
    <div className={`bg-gradient-to-r ${gradientClasses[gradient]} rounded-2xl shadow-xl p-6 md:p-8 text-white mb-6`}>
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-4 flex-1">
          {icon && (
            <div className="w-12 h-12 bg-white/20 backdrop-blur-sm rounded-xl flex items-center justify-center flex-shrink-0">
              {icon}
            </div>
          )}
          <div className="flex-1">
            <h1 className="text-3xl md:text-4xl font-bold mb-2">{title}</h1>
            {subtitle && <p className="text-white/90 text-base md:text-lg">{subtitle}</p>}
          </div>
        </div>
        {action && <div className="flex-shrink-0 ml-4">{action}</div>}
      </div>
    </div>
  );
}




