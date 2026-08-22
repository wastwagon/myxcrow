import { type ReactNode } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { cn } from '@/lib/utils';

type AuthMode = 'login' | 'register';

function AuthModeTabs({ mode }: { mode: AuthMode }) {
  return (
    <div
      role="tablist"
      className="flex w-full p-1 rounded-[16px] bg-[#e5e5ea]"
    >
      <Link
        href="/register"
        role="tab"
        aria-selected={mode === 'register'}
        className={cn(
          'flex-1 min-h-[44px] inline-flex items-center justify-center px-3 py-1.5 rounded-[16px] text-[15px] font-semibold transition-colors touch-manipulation',
          mode === 'register' ? 'bg-white text-gray-900 shadow-sm' : 'text-[rgba(60,60,67,0.6)]'
        )}
      >
        Sign up
      </Link>
      <Link
        href="/login"
        role="tab"
        aria-selected={mode === 'login'}
        className={cn(
          'flex-1 min-h-[44px] inline-flex items-center justify-center px-3 py-1.5 rounded-[16px] text-[15px] font-semibold transition-colors touch-manipulation',
          mode === 'login' ? 'bg-white text-gray-900 shadow-sm' : 'text-[rgba(60,60,67,0.6)]'
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
  titleVariant = 'heading',
  children,
  footer,
  mode,
  className,
  maxWidthClass = 'max-w-[360px]',
}: {
  title: string;
  subtitle?: string;
  /** Compact capsule instead of the large page title. */
  titleVariant?: 'heading' | 'badge';
  children: ReactNode;
  footer?: ReactNode;
  /** When set, shows Sign up / Log in tabs */
  mode?: AuthMode;
  className?: string;
  maxWidthClass?: string;
}) {
  return (
    <div className="min-h-screen bg-[#f2f2f7] flex flex-col pt-safe">
      <div
        className={cn(
          'flex-1 flex flex-col items-center px-4 pt-10 pb-12 sm:pt-16 sm:pb-16',
          className
        )}
      >
        <div className={cn('w-full flex flex-col items-center gap-6', maxWidthClass)}>
          <div className="flex flex-col items-center gap-5 w-full text-center">
            <Link href="/" className="inline-flex flex-col items-center gap-3 group min-h-[44px]">
              <div className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-[16px] bg-brand-maroon-deep ring-1 ring-brand-gold/35 shadow-sm">
                <Image
                  src="/logo/MYXCROWLOGO.png"
                  alt="MYXCROW"
                  width={40}
                  height={40}
                  className="object-contain"
                  priority
                />
              </div>
              <span className="text-[13px] font-semibold tracking-tight text-brand-maroon">MYXCROW</span>
            </Link>

            <div className={cn('w-full', titleVariant === 'heading' && subtitle && 'space-y-2')}>
              {titleVariant === 'badge' ? (
                <h1 className="inline-flex items-center rounded-full bg-white px-3.5 py-1 text-[12px] font-semibold tracking-tight text-brand-maroon ring-1 ring-black/[0.06] shadow-sm">
                  {title}
                </h1>
              ) : (
                <h1 className="text-[34px] font-bold tracking-tight leading-[1.15] text-gray-900">{title}</h1>
              )}
              {subtitle && <p className="text-[15px] text-[rgba(60,60,67,0.6)]">{subtitle}</p>}
            </div>

            {mode && <AuthModeTabs mode={mode} />}
          </div>

          <div className="w-full rounded-[20px] bg-white p-5 sm:p-6">{children}</div>

          {footer && <div className="w-full text-center text-[15px] text-[rgba(60,60,67,0.6)]">{footer}</div>}
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
      ? 'bg-green-50 text-green-800'
      : tone === 'warning'
        ? 'bg-amber-50 text-amber-900'
        : 'bg-red-50 text-red-700';

  return (
    <div
      id={id}
      role="alert"
      className={cn('mb-4 rounded-[16px] px-3 py-3 text-sm flex items-start gap-2', styles)}
    >
      <div className="flex-1 min-w-0">{children}</div>
      {onDismiss && (
        <button
          type="button"
          onClick={onDismiss}
          className="text-current hover:opacity-80 shrink-0 min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-[16px] touch-manipulation"
          aria-label="Dismiss"
        >
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
        <h2 className="text-[22px] font-bold text-gray-900">{title}</h2>
        <p className="text-[15px] text-[rgba(60,60,67,0.6)] leading-relaxed">{description}</p>
      </div>
      {children && <div className="w-full pt-2">{children}</div>}
    </div>
  );
}
