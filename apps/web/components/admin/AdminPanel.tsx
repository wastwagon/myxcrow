import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { admin } from './adminClasses';

interface AdminPanelProps {
  children: ReactNode;
  className?: string;
  padding?: boolean;
}

export function AdminPanel({ children, className, padding = true }: AdminPanelProps) {
  return (
    <div className={cn(admin.panel, padding && 'p-6', className)}>{children}</div>
  );
}
