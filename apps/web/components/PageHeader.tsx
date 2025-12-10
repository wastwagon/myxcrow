import { ReactNode } from 'react';
import { Shield } from 'lucide-react';

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  icon?: ReactNode;
  action?: ReactNode;
  gradient?: 'blue' | 'purple' | 'green' | 'red' | 'yellow';
}

export default function PageHeader({ title, subtitle, icon, action, gradient = 'blue' }: PageHeaderProps) {
  const gradientClasses = {
    blue: 'from-blue-600 to-purple-600',
    purple: 'from-purple-600 to-indigo-600',
    green: 'from-green-600 to-emerald-600',
    red: 'from-red-600 to-pink-600',
    yellow: 'from-yellow-600 to-orange-600',
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




