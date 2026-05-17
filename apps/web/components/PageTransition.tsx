import { type ReactNode } from 'react';
import { useRouter } from 'next/router';

interface PageTransitionProps {
  children: ReactNode;
}

export default function PageTransition({ children }: PageTransitionProps) {
  const router = useRouter();

  return (
    <div key={router.asPath} className="page-transition-in flex-1 min-h-0">
      {children}
    </div>
  );
}
