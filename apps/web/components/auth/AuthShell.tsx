import { type ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';

type AuthMode = 'login' | 'register';

function AuthModeTabs({ mode }: { mode: AuthMode }) {
  return (
    <div
      role="tablist"
      className="flex w-full p-1 rounded-ios-lg border border-gray-200 bg-gray-100"
    >
      <Link
        href="/register"
        role="tab"
        aria-selected={mode === 'register'}
        className={cn(
          'flex-1 min-h-[36px] inline-flex items-center justify-center px-3 py-1.5 rounded-ios text-sm font-semibold transition-colors',
          mode === 'register'
            ? 'bg-white text-gray-900 shadow-sm border border-gray-200/80'
            : 'text-gray-500 hover:text-gray-800'
        )}
      >
        Sign up
      </Link>
      <Link
        href="/login"
        role="tab"
        aria-selected={mode === 'login'}
        className={cn(
          'flex-1 min-h-[36px] inline-flex items-center justify-center px-3 py-1.5 rounded-ios text-sm font-semibold transition-colors',
          mode === 'login'
            ? 'bg-white text-gray-900 shadow-sm border border-gray-200/80'
            : 'text-gray-500 hover:text-gray-800'
        )}
      >
        Log in
      </Link>
    </div>
  );
}

export function AuthShell({
  title,
  subtitle,
  children,
  footer,
  mode,
  className,
  maxWidthClass = 'max-w-[360px]',
}: {
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  /** When set, shows Sign up / Log in tabs */
  mode?: AuthMode;
  className?: string;
  maxWidthClass?: string;
}) {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <div
        className={cn(
          'flex-1 flex flex-col items-center px-4 pt-10 pb-12 sm:pt-16 sm:pb-16',
          className
        )}
      >
        <div className={cn('w-full flex flex-col items-center gap-6', maxWidthClass)}>
          <div className="flex flex-col items-center gap-5 w-full text-center">
            <Link href="/" className="inline-flex flex-col items-center gap-3 group">
              <div className="relative flex h-10 w-10 items-center justify-center overflow-hidden rounded-lg border border-gray-200 bg-white shadow-sm ring-1 ring-brand-maroon/10 group-hover:ring-brand-gold/40 transition">
                <Image
                  src="/logo/MYXCROWLOGO.png"
                  alt="MYXCROW"
                  width={40}
                  height={40}
                  className="object-contain"
                  priority
                />
              </div>
              <span className="text-sm font-bold tracking-tight text-brand-maroon">MYXCROW</span>
            </Link>

            <div className="space-y-2 w-full">
              <h1 className="text-2xl font-semibold tracking-tight text-gray-900">{title}</h1>
              {subtitle && <p className="text-base text-gray-500">{subtitle}</p>}
            </div>

            {mode && <AuthModeTabs mode={mode} />}
          </div>

          <div className="w-full">{children}</div>

          {footer && <div className="w-full text-center text-sm text-gray-500">{footer}</div>}
        </div>
      </div>
    </div>
  );
}

export function AuthAlert({
  tone = 'error',
  children,
  onDismiss,
  id,
}: {
  tone?: 'error' | 'success' | 'warning';
  children: ReactNode;
  onDismiss?: () => void;
  id?: string;
}) {
  const styles =
    tone === 'success'
      ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
      : tone === 'warning'
        ? 'bg-amber-50 border-amber-200 text-amber-900'
        : 'bg-red-50 border-red-200 text-red-700';

  return (
    <div
      id={id}
      role="alert"
      className={cn('mb-4 rounded-lg border px-3 py-3 text-sm flex items-start gap-2', styles)}
    >
      <div className="flex-1 min-w-0">{children}</div>
      {onDismiss && (
        <button type="button" onClick={onDismiss} className="text-current/70 hover:text-current shrink-0">
          ×
        </button>
      )}
    </div>
  );
}

export function AuthSuccessPanel({
  icon,
  title,
  description,
  children,
}: {
  icon: ReactNode;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center text-center gap-4 py-2">
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-brand-maroon/10 text-brand-maroon">
        {icon}
      </div>
      <div className="space-y-2">
        <h2 className="text-lg font-semibold text-gray-900">{title}</h2>
        <p className="text-sm text-gray-500 leading-relaxed">{description}</p>
      </div>
      {children && <div className="w-full pt-2">{children}</div>}
    </div>
  );
}
