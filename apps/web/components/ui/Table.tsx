import {
  type HTMLAttributes,
  type TdHTMLAttributes,
  type ThHTMLAttributes,
  type ReactNode,
  createContext,
  useContext,
} from 'react';
import { cn } from '@/lib/utils';
import { admin } from '@/components/admin/adminClasses';
import { dash } from '@/components/dashboard/lightClasses';

type TableTone = 'dark' | 'light';

const TableToneContext = createContext<TableTone>('dark');

function useTableTone() {
  return useContext(TableToneContext);
}

export function TableShell({
  children,
  toolbar,
  footer,
  className,
  tone = 'dark',
}: {
  children: ReactNode;
  toolbar?: ReactNode;
  footer?: ReactNode;
  className?: string;
  tone?: TableTone;
}) {
  const light = tone === 'light';
  return (
    <TableToneContext.Provider value={tone}>
      <div
        className={cn(
          light ? dash.panelFlush : admin.tableWrap,
          className
        )}
      >
        {toolbar && (
          <div className={cn(light ? 'p-4 border-b border-gray-100 bg-gray-50/80' : admin.tableToolbar)}>
            {toolbar}
          </div>
        )}
        <div className="overflow-x-auto">{children}</div>
        {footer && (
          <div
            className={cn(
              light
                ? 'px-4 py-3 bg-gray-50/80 border-t border-gray-100 text-sm text-gray-600'
                : admin.footerBar
            )}
          >
            {footer}
          </div>
        )}
      </div>
    </TableToneContext.Provider>
  );
}

export function Table({ className, ...props }: HTMLAttributes<HTMLTableElement>) {
  return <table className={cn('w-full', className)} {...props} />;
}

export function TableHead({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  const tone = useTableTone();
  return (
    <thead
      className={cn(tone === 'light' ? dash.tableHead : admin.tableHead, className)}
      {...props}
    />
  );
}

export function TableBody({ className, ...props }: HTMLAttributes<HTMLTableSectionElement>) {
  const tone = useTableTone();
  return (
    <tbody
      className={cn(tone === 'light' ? 'divide-y divide-gray-100' : admin.tbody, className)}
      {...props}
    />
  );
}

export function TableRow({
  hover = true,
  className,
  ...props
}: HTMLAttributes<HTMLTableRowElement> & { hover?: boolean }) {
  const tone = useTableTone();
  return (
    <tr
      className={cn(
        hover && (tone === 'light' ? dash.trHover : admin.trHover),
        className
      )}
      {...props}
    />
  );
}

export function TableTh({ className, ...props }: ThHTMLAttributes<HTMLTableCellElement>) {
  const tone = useTableTone();
  return (
    <th className={cn(tone === 'light' ? dash.th : admin.th, className)} {...props} />
  );
}

export function TableTd({
  muted,
  className,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement> & { muted?: boolean }) {
  const tone = useTableTone();
  const light = tone === 'light';
  return (
    <td
      className={cn(
        light ? dash.td : admin.td,
        muted && (light ? dash.tdMuted : admin.tdMuted),
        className
      )}
      {...props}
    />
  );
}

export function TableEmpty({
  colSpan,
  children,
}: {
  colSpan: number;
  children: ReactNode;
}) {
  const tone = useTableTone();
  return (
    <tr>
      <td
        colSpan={colSpan}
        className={cn(
          tone === 'light' ? dash.td : admin.td,
          'text-center py-12',
          tone === 'light' ? 'text-gray-500' : 'text-white/55'
        )}
      >
        {children}
      </td>
    </tr>
  );
}
