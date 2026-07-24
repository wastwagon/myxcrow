import { type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { dash } from './lightClasses';

export function LightShell({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn(dash.shell, className)}>{children}</div>;
}

export function LightPanel({
  children,
  className,
  flush,
}: {
  children: ReactNode;
  className?: string;
  flush?: boolean;
}) {
  return <div className={cn(flush ? dash.panelFlush : dash.panel, className)}>{children}</div>;
}
