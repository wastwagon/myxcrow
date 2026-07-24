import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import apiClient from '@/lib/api-client';
import { getErrorMessage } from '@/lib/error-messages';
import { setAuthTokens, setUser } from '@/lib/auth';
import { Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Checkbox } from '@/components/ui/Checkbox';
import { Field } from '@/components/ui/Field';
import { AuthAlert, AuthShell } from '@/components/auth/AuthShell';

const loginSchema = z.object({
  identifier: z.string().min(1, 'Enter email or phone').refine(
    (val) =>
      /^(\+?233[0-9]{9}|0[0-9]{9})$/.test(val.replace(/\s/g, '')) ||
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
    'Enter email or Ghana phone (e.g. 0551234567)'
  ),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  remember: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: { remember: true },
  });

  const onSubmit = async (data: LoginFormData) => {
    try {
      setLoading(true);
      setError(null);
      const response = await apiClient.post('/auth/login', {
        identifier: data.identifier.trim(),
        password: data.password,
      });
      const { user, accessToken, refreshToken } = response.data;

      setAuthTokens(accessToken, refreshToken);
      setUser(user);

      router.push('/dashboard');
    } catch (err: unknown) {
      setError(getErrorMessage(err, 'Login failed. Please try again.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthShell
      mode="login"
      title="Log in to your account"
      subtitle="Welcome back. Enter your details to continue."
      footer={
        <p>
          Don&apos;t have an account?{' '}
          <Link href="/register" className="font-semibold text-brand-maroon hover:text-brand-maroon-dark">
            Sign up
          </Link>
        </p>
      }
    >
      {error && <AuthAlert>{error}</AuthAlert>}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        <Field
          tone="light"
          label="Email or phone"
          htmlFor="identifier"
          error={errors.identifier?.message}
          hint="Ghana phone (055…) or email"
        >
          <Input
            {...register('identifier')}
            tone="light"
            type="text"
            id="identifier"
            autoComplete="username"
            placeholder="you@example.com or 0551234567"
            error={!!errors.identifier}
          />
        </Field>

        <Field tone="light" label="Password" htmlFor="password" error={errors.password?.message}>
          <Input
            {...register('password')}
            tone="light"
            type={showPassword ? 'text' : 'password'}
            id="password"
            autoComplete="current-password"
            placeholder="••••••••"
            error={!!errors.password}
            trailing={
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="px-2 text-gray-500 hover:text-brand-maroon"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            }
          />
        </Field>

        <div className="flex items-center justify-between gap-3">
          <Checkbox tone="light" {...register('remember')} label="Remember for 30 days" />
          <Link
            href="/forgot-password"
            className="text-sm font-semibold text-brand-maroon hover:text-brand-maroon-dark whitespace-nowrap"
          >
            Forgot password
          </Link>
        </div>

        <Button type="submit" disabled={loading} loading={loading} variant="maroon" fullWidth size="lg">
          Sign in
        </Button>
      </form>

      <p className="mt-6 text-center text-xs text-gray-400">
        <Link href="/terms" className="hover:text-brand-maroon">
          Terms
        </Link>
        {' · '}
        <Link href="/privacy" className="hover:text-brand-maroon">
          Privacy
        </Link>
      </p>
    </AuthShell>
  );
}
