import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import apiClient from '@/lib/api-client';
import { getErrorMessage } from '@/lib/error-messages';
import { setAuthTokens, setUser } from '@/lib/auth';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import PublicHeader from '@/components/PublicHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { publicForm } from '@/lib/form-classes';

const loginSchema = z.object({
  identifier: z.string().min(1, 'Enter email or phone').refine(
    (val) => /^(\+?233[0-9]{9}|0[0-9]{9})$/.test(val.replace(/\s/g, '')) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
    'Enter email or Ghana phone (e.g. 0551234567)',
  ),
  password: z.string().min(6, 'Password must be at least 6 characters'),
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
    <>
      <PublicHeader />
      <div className="min-h-screen bg-gradient-to-br from-[#1f1414] via-[#331518] to-[#160f10] flex items-center justify-center px-4 py-8">
        <div className="max-w-md w-full">
          <section className="relative mb-6 min-h-[180px] overflow-hidden rounded-[1.25rem] border border-white/10 bg-brand-maroon-black shadow-ios-card">
            <Image
              src="/images/v2/protected-payments-hero.jpg"
              alt=""
              fill
              priority
              sizes="(max-width: 768px) 100vw, 448px"
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-black/20" />
            <div className="relative z-10 flex min-h-[180px] flex-col justify-end p-5">
              <div className="mb-3 flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-brand-maroon-deep ring-2 ring-brand-gold/30">
                <Image src="/logo/MYXCROWLOGO.png" alt="MYXCROW" width={44} height={44} className="object-contain" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-white">MYXCROW</h1>
              <p className="mt-1 text-sm font-medium text-brand-gold">Secure escrow for Ghana</p>
              <p className="mt-1 text-xs leading-relaxed text-white/70">
                Sign in to protect payments and manage your agreements.
              </p>
            </div>
          </section>

          <div className="bg-white/95 rounded-2xl shadow-xl p-6 md:p-8 border border-brand-gold/20">
            <div className="text-center mb-6">
              <h2 className={publicForm.cardTitle}>Sign In</h2>
              <p className={publicForm.cardSubtitle}>Access your escrow account</p>
            </div>

            {error && (
              <div className={publicForm.calloutError}>
                <AlertCircle className="w-5 h-5 shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label htmlFor="identifier" className={publicForm.label}>
                  Email or Phone
                </label>
                <Input
                  {...register('identifier')}
                  tone="light"
                  type="text"
                  id="identifier"
                  placeholder="you@example.com or 0551234567"
                  error={!!errors.identifier}
                />
                <p className={publicForm.hint}>Enter your email or Ghana phone number</p>
                {errors.identifier && <p className={publicForm.error}>{errors.identifier.message}</p>}
              </div>

              <div>
                <label htmlFor="password" className={publicForm.label}>
                  Password
                </label>
                <Input
                  {...register('password')}
                  tone="light"
                  type={showPassword ? 'text' : 'password'}
                  id="password"
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
                {errors.password && <p className={publicForm.error}>{errors.password.message}</p>}
                <div className="mt-2 text-right">
                  <Link
                    href="/forgot-password"
                    className="text-sm font-semibold text-brand-maroon hover:text-brand-maroon-dark"
                  >
                    Forgot password?
                  </Link>
                </div>
              </div>

              <Button type="submit" disabled={loading} loading={loading} variant="maroon" fullWidth size="lg">
                Sign In
              </Button>
            </form>

            <div className={publicForm.footer}>
              <p className={publicForm.footerMuted}>
                <Link href="/terms" className="text-brand-maroon font-semibold hover:underline">
                  Terms
                </Link>
                {' · '}
                <Link href="/privacy" className="text-brand-maroon font-semibold hover:underline">
                  Privacy
                </Link>
              </p>
              <p className={publicForm.footerText}>
                Don&apos;t have an account?{' '}
                <Link
                  href="/register"
                  className="text-brand-maroon hover:text-brand-maroon-dark font-semibold transition-colors"
                >
                  Sign up
                </Link>
              </p>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-white/60 max-w-md mx-auto">
            Your information is secure. We use industry-standard encryption to protect your data.
          </p>
        </div>
      </div>
    </>
  );
}
