import { type ReactNode } from 'react';

/** Phone grouped lists. Hidden from xl where DesktopOnly tables take over. */
export function PhoneOnly({ children }: { children: ReactNode }) {
  return <div className="xl:hidden">{children}</div>;
}

/** iPad/Mac tables. Hidden below xl so phone stays on lists. */
export function DesktopOnly({ children }: { children: ReactNode }) {
  return <div className="hidden xl:block">{children}</div>;
}
