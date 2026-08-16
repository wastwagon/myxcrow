import { useState } from 'react';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import apiClient from '@/lib/api-client';
import { MessageSquare, Smartphone } from 'lucide-react';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Field } from '@/components/ui/Field';
import { AuthAlert, AuthShell, AuthSuccessPanel } from '@/components/auth/AuthShell';

const schema = z.object({
  identifier: z.string().min(1, 'Enter email or phone').refine(
    (val) =>
      /^(\+?233[0-9]{9}|0[0-9]{9})$/.test(val.replace(/\s/g, '')) ||
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
    'Enter email or Ghana phone (e.g. 0551234567)'
  ),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { identifier: '' },
  });

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      setError(null);
      await apiClient.post('/auth/password-reset/request', { identifier: data.identifier.trim() });
      setSent(true);
    } catch (err: unknown) {
      const message =
        err &&
        typeof err === 'object' &&
        'response' in err &&
        (err as { response?: { data?: { message?: string } } }).response?.data?.message;
      setError(typeof message === 'string' ? message : 'Failed to request password reset. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      title={sent ? 'Check your messages' : 'Forgot password?'}
      subtitle={
        sent
          ? undefined
          : "No worries — enter your email or phone and we'll text a reset link to the phone on your account."
      }
      footer={
        !sent ? (
          <p>
            Remembered your password?{' '}
            <Link
              href="/login"
              className="inline-flex min-h-[44px] items-center font-semibold text-brand-maroon hover:text-brand-maroon-dark touch-manipulation"
            >
              Sign in
            </Link>
          </p>
        ) : undefined
      }
    >
      {error && <AuthAlert>{error}</AuthAlert>}

      {sent ? (
        <AuthSuccessPanel
          icon={<MessageSquare className="w-7 h-7" />}
          title="SMS sent"
          description="If an account exists with a phone number on file, we sent a reset link by SMS. Open the link on your phone to set a new password."
        >
          <div className="space-y-3">
            <ButtonLink href="/login" variant="maroon" fullWidth size="lg">
              Back to login
            </ButtonLink>
            <Button
              type="button"
              variant="outline"
              fullWidth
              onClick={() => {
                setSent(false);
                setError(null);
              }}
            >
              Try another number or email
            </Button>
          </div>
        </AuthSuccessPanel>
      ) : (
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          <Field
            tone="light"
            label="Email or phone"
            htmlFor="identifier"
            error={errors.identifier?.message}
            hint="Reset link is sent by SMS to the phone registered on your account"
          >
            <Input
              {...register('identifier')}
              tone="light"
              type="text"
              id="identifier"
              placeholder="you@example.com or 0551234567"
              error={!!errors.identifier}
              leading={<Smartphone className="w-4 h-4" />}
            />
          </Field>

          <Button type="submit" disabled={loading} loading={loading} variant="maroon" fullWidth size="lg">
            Send reset link via SMS
          </Button>
        </form>
      )}
    </AuthShell>
  );
}
