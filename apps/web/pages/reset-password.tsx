import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import apiClient from '@/lib/api-client';
import { CheckCircle2, Eye, EyeOff, Lock } from 'lucide-react';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Field } from '@/components/ui/Field';
import { AuthAlert, AuthShell, AuthSuccessPanel } from '@/components/auth/AuthShell';

const schema = z
  .object({
    token: z.string().min(10, 'Invalid token'),
    newPassword: z.string().min(8, 'Password must be at least 8 characters'),
    confirmPassword: z.string().min(8, 'Password must be at least 8 characters'),
  })
  .refine((v) => v.newPassword === v.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match',
  });

type FormData = z.infer<typeof schema>;

export default function ResetPasswordPage() {
  const router = useRouter();
  const tokenFromQuery = typeof router.query.token === 'string' ? router.query.token : '';
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: {
      token: '',
      newPassword: '',
      confirmPassword: '',
    },
  });

  useEffect(() => {
    if (tokenFromQuery) {
      setValue('token', tokenFromQuery);
    }
  }, [tokenFromQuery, setValue]);

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      setError(null);
      await apiClient.post('/auth/password-reset/confirm', {
        token: data.token,
        newPassword: data.newPassword,
      });
      setDone(true);
    } catch (err: unknown) {
      const message =
        err &&
        typeof err === 'object' &&
        'response' in err &&
        (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      setError(typeof message === 'string' ? message : 'Failed to reset password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title={done ? 'Password reset' : 'Set a new password'}
      subtitle={done ? undefined : 'Choose a strong password to secure your MYXCROW account.'}
      footer={
        !done ? (
          <Link
            href="/login"
            className="inline-flex min-h-[44px] items-center font-semibold text-brand-maroon hover:text-brand-maroon-dark touch-manipulation"
          >
            Back to login
          </Link>
        ) : undefined
      }
    >
      {error && <AuthAlert>{error}</AuthAlert>}

      {done ? (
        <AuthSuccessPanel
          icon={<CheckCircle2 className="w-7 h-7" />}
          title="You're all set"
          description="Password reset successful. A confirmation SMS has been sent to your phone. You can now sign in."
        >
          <ButtonLink href="/login" variant="maroon" fullWidth size="lg">
            Continue to login
          </ButtonLink>
        </AuthSuccessPanel>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {!tokenFromQuery && (
            <Field tone="light" label="Reset token" htmlFor="token" error={errors.token?.message}>
              <Input
                {...register('token')}
                tone="light"
                type="text"
                id="token"
                placeholder="Paste token from your SMS link"
                error={!!errors.token}
              />
            </Field>
          )}
          {tokenFromQuery && <input type="hidden" {...register('token')} />}

          <Field
            tone="light"
            label="New password"
            htmlFor="newPassword"
            error={errors.newPassword?.message}
            hint="Minimum 8 characters"
          >
            <Input
              {...register('newPassword')}
              tone="light"
              type={showPassword ? 'text' : 'password'}
              id="newPassword"
              autoComplete="new-password"
              placeholder="••••••••"
              error={!!errors.newPassword}
              leading={<Lock className="w-4 h-4" />}
              trailing={
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="px-2 min-h-[44px] min-w-[44px] text-gray-600 hover:text-brand-maroon touch-manipulation"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              }
            />
          </Field>

          <Field
            tone="light"
            label="Confirm password"
            htmlFor="confirmPassword"
            error={errors.confirmPassword?.message}
          >
            <Input
              {...register('confirmPassword')}
              tone="light"
              type={showPassword ? 'text' : 'password'}
              id="confirmPassword"
              autoComplete="new-password"
              placeholder="••••••••"
              error={!!errors.confirmPassword}
            />
          </Field>

          <Button type="submit" disabled={loading} loading={loading} variant="maroon" fullWidth size="lg">
            Reset password
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
