import { type ReactNode } from 'react';

interface PageTransitionProps {
  children: ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
  return (
    <div className="page-transition-in flex-1 min-h-0 flex flex-col">
      {children}
    </div>
  );
}
