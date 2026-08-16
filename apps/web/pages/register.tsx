import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import apiClient from '@/lib/api-client';
import { getErrorMessage } from '@/lib/error-messages';
import { setUser } from '@/lib/auth';
import { Check, Eye, EyeOff, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Field } from '@/components/ui/Field';
import { AuthAlert, AuthShell } from '@/components/auth/AuthShell';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().regex(/^0[0-9]{9}$/, 'Enter Ghana phone (e.g. 0551234567)'),
  code: z.string().length(6, 'Enter the 6-digit code').optional(),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function Register() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [codeSent, setCodeSent] = useState(false);
  const [countdown, setCountdown] = useState(0);
  const [devCode, setDevCode] = useState<string | null>(null);
  const countdownRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    return () => {
      if (countdownRef.current) clearInterval(countdownRef.current);
    };
  }, []);

  useEffect(() => {
    if (countdown <= 0 && countdownRef.current) {
      clearInterval(countdownRef.current);
      countdownRef.current = null;
    }
  }, [countdown]);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
  });

  const phone = watch('phone');

  const onSendCode = async () => {
    const p = phone?.trim();
    if (!p || !/^0[0-9]{9}$/.test(p)) {
      setError('Enter a valid Ghana phone number first');
      return;
    }
    try {
      setLoading(true);
      setError(null);
      setDevCode(null);
      const res = await apiClient.post('/auth/send-phone-otp', { phone: p });
      setCodeSent(true);
      setCountdown(60);
      if (countdownRef.current) clearInterval(countdownRef.current);
      countdownRef.current = setInterval(() => setCountdown((c) => Math.max(0, c - 1)), 1000);
      if (res.data?.devCode) {
        setDevCode(res.data.devCode);
        setValue('code', res.data.devCode);
      }
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Failed to send code'));
      setTimeout(
        () => document.getElementById('register-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' }),
        100
      );
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (data: RegisterFormData) => {
    if (!codeSent || !data.code || data.code.length !== 6) {
      setError('Please request and enter the 6-digit verification code first');
      return;
    }
    try {
      setLoading(true);
      setError(null);

      const response = await apiClient.post('/auth/register', {
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        code: data.code,
      });

      const { user } = response.data;
      setUser(user);
      router.push('/dashboard');
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Registration failed. Please try again.'));
      setTimeout(() => {
        document.getElementById('register-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      mode="register"
      title="Create your account"
      subtitle="Join MYXCROW and protect every deal with escrow."
      maxWidthClass="max-w-[400px]"
      footer={
        <p>
          Already have an account?{' '}
          <Link
            href="/login"
            className="inline-flex min-h-[44px] items-center font-semibold text-brand-maroon hover:text-brand-maroon-dark touch-manipulation"
          >
            Sign in
          </Link>
        </p>
      }
    >
      {error && (
        <AuthAlert id="register-error" onDismiss={() => setError(null)}>
          {error}
        </AuthAlert>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Field tone="light" label="First name" htmlFor="firstName" error={errors.firstName?.message}>
            <Input
              {...register('firstName')}
              tone="light"
              id="firstName"
              placeholder="John"
              error={!!errors.firstName}
            />
          </Field>
          <Field tone="light" label="Last name" htmlFor="lastName" error={errors.lastName?.message}>
            <Input
              {...register('lastName')}
              tone="light"
              id="lastName"
              placeholder="Doe"
              error={!!errors.lastName}
            />
          </Field>
        </div>

        <Field tone="light" label="Email" htmlFor="email" error={errors.email?.message}>
          <Input
            {...register('email')}
            tone="light"
            type="email"
            id="email"
            autoComplete="email"
            placeholder="you@example.com"
            error={!!errors.email}
          />
        </Field>

        <Field
          tone="light"
          label="Phone number"
          htmlFor="phone"
          error={errors.phone?.message}
          hint="Ghana number (MTN, Vodafone, or AirtelTigo)"
        >
          <Input
            {...register('phone')}
            tone="light"
            type="tel"
            id="phone"
            placeholder="0551234567"
            error={!!errors.phone}
          />
        </Field>

        {codeSent ? (
          <div className="space-y-3">
            {devCode ? (
              <AuthAlert tone="warning">
                <p className="font-medium">SMS not configured — use this test code:</p>
                <p className="mt-1 font-mono text-lg tracking-widest">{devCode}</p>
              </AuthAlert>
            ) : (
              <AuthAlert tone="success">Code sent. Check your phone for the 6-digit code.</AuthAlert>
            )}
            <Field tone="light" label="Verification code" htmlFor="code" error={errors.code?.message}>
              <Input
                {...register('code')}
                tone="light"
                type="text"
                inputMode="numeric"
                maxLength={6}
                id="code"
                className="text-center text-lg tracking-widest"
                placeholder="123456"
                error={!!errors.code}
              />
            </Field>
            <button
              type="button"
              onClick={onSendCode}
              disabled={loading || countdown > 0}
              className="inline-flex min-h-[44px] items-center text-[15px] font-semibold text-brand-maroon hover:underline disabled:opacity-50 touch-manipulation"
            >
              {countdown > 0 ? `Resend code in ${countdown}s` : 'Resend code'}
            </button>
          </div>
        ) : (
          <Button
            type="button"
            variant="outline"
            fullWidth
            onClick={onSendCode}
            disabled={loading || countdown > 0 || !phone || !/^0[0-9]{9}$/.test(phone)}
            loading={loading}
          >
            <MessageCircle className="w-4 h-4" />
            {countdown > 0 ? `Resend in ${countdown}s` : 'Send verification code'}
          </Button>
        )}

        <Field
          tone="light"
          label="Password"
          htmlFor="password"
          error={errors.password?.message}
          hint="Minimum 8 characters"
        >
          <Input
            {...register('password')}
            tone="light"
            type={showPassword ? 'text' : 'password'}
            id="password"
            autoComplete="new-password"
            placeholder="••••••••"
            error={!!errors.password}
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

        <Button
          type="submit"
          disabled={loading || !codeSent}
          loading={loading}
          variant="maroon"
          fullWidth
          size="lg"
        >
          Create account
          {!loading && <Check className="w-5 h-5" />}
        </Button>
      </form>

      <p className="mt-6 text-center text-[13px] text-[rgba(60,60,67,0.6)] leading-relaxed">
        By registering you agree to our{' '}
        <Link href="/terms" className="inline-flex min-h-[44px] items-center font-semibold text-brand-maroon hover:underline touch-manipulation">
          Terms
        </Link>{' '}
        and{' '}
        <Link href="/privacy" className="inline-flex min-h-[44px] items-center font-semibold text-brand-maroon hover:underline touch-manipulation">
          Privacy Policy
        </Link>
        .
      </p>
    </AuthShell>
  );
}
