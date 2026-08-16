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

const TableToneContext = createContext<TableTone>('light');

function useTableTone() {
  return useContext(TableToneContext);
}

export function TableShell({
  children,
  toolbar,
  footer,
  className,
  tone = 'light',
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
          <div
            className={cn(
              light
                ? 'p-4 border-b border-[rgba(60,60,67,0.12)]'
                : admin.tableToolbar
            )}
          >
            {toolbar}
          </div>
        )}
        <div className="overflow-x-auto xl:overflow-visible">{children}</div>
        {footer && (
          <div
            className={cn(
              light
                ? 'px-4 py-3 border-t border-[rgba(60,60,67,0.12)] text-[13px] text-[rgba(60,60,67,0.6)]'
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
      className={cn(tone === 'light' ? undefined : admin.tbody, className)}
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
  const light = tone === 'light';
  return (
    <tr
      className={cn(
        hover && (light ? dash.trHover : admin.trHover),
        light &&
          'relative after:absolute after:right-0 after:bottom-0 after:left-4 after:h-px after:bg-[rgba(60,60,67,0.12)] last:after:hidden',
        className
      )}
      {...props}
    />
  );
}

export function TableTh({
  numeric,
  className,
  ...props
}: ThHTMLAttributes<HTMLTableCellElement> & { numeric?: boolean }) {
  const tone = useTableTone();
  return (
    <th
      className={cn(
        tone === 'light' ? dash.th : admin.th,
        numeric && 'text-right tabular-nums',
        tone === 'light' &&
          'sticky z-10 bg-white/90 backdrop-blur-xl top-[var(--table-sticky-top,0px)] shadow-[inset_0_-0.5px_0_rgba(60,60,67,0.12)]',
        className
      )}
      {...props}
    />
  );
}

export function TableTd({
  muted,
  numeric,
  className,
  ...props
}: TdHTMLAttributes<HTMLTableCellElement> & { muted?: boolean; numeric?: boolean }) {
  const tone = useTableTone();
  const light = tone === 'light';
  return (
    <td
      className={cn(
        light ? dash.td : admin.td,
        muted && (light ? dash.tdMuted : admin.tdMuted),
        numeric && 'text-right tabular-nums',
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
