import { type HTMLAttributes, type TdHTMLAttributes, type ThHTMLAttributes, type ReactNode } from 'react';
import { cn } from '@/lib/utils';
import { admin } from '@/components/admin/adminClasses';

export function TableShell({
  children,
  toolbar,
  footer,
  className,
}: {
  children: ReactNode;
  toolbar?: ReactNode;
  footer?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn(admin.tableWrap, className)}>
      {toolbar && <div className={admin.tableToolbar}>{toolbar}</div>}
      <div className="overflow-x-auto">{children}</div>
      {footer && <div className={admin.footerBar}>{footer}</div>}
    </div>
  );
}

export function Table({ className, ...props }: HTMLAttributes<HTMLTableElement>) {
  return <table className={cn('w-full', className)} {...props} />;
}

export function TableHead({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <thead className={cn(admin.tableHead, className)} {...props} />;
}

export function TableBody({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  return <tbody className={cn(admin.tbody, className)} {...props} />;
}

export function TableRow({
  hover = true,
  className,
  ...props
}: HTMLAttributes<HTMLTableRowElement> & { hover?: boolean }) {
  return <tr className={cn(hover && admin.trHover, className)} {...props} />;
}

export function TableTh({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  return <th className={cn(admin.th, className)} {...props} />;
}

export function TableTd({
  muted,
  className,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement> & { muted?: boolean }) {
  return <td className={cn(admin.td, muted && admin.tdMuted, className)} {...props} />;
}

export function TableEmpty({
  colSpan,
  children,
}: {
  colSpan: number;
  children: ReactNode;
}) {
  return (
    <tr>
      <td colSpan={colSpan} className={cn(admin.td, 'text-center py-12 text-white/55')}>
        {children}
      </td>
    </tr>
  );
}
