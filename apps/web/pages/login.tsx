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
import { Loader2, AlertCircle, Eye, EyeOff } from 'lucide-react';
import PublicHeader from '@/components/PublicHeader';
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
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg overflow-hidden bg-brand-maroon-deep">
              <Image src="/logo/MYXCROWLOGO.png" alt="MYXCROW" width={64} height={64} className="object-contain" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-2 text-white">MYXCROW</h1>
            <p className="text-lg font-semibold text-brand-gold mb-1">
              Secure Escrow Services for Safe Transactions
            </p>
            <p className="text-sm text-white/70 max-w-md mx-auto">
              Protect your payments with our trusted escrow platform. Funds are held securely until both
              parties are satisfied.
            </p>
          </div>

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
                <input
                  {...register('identifier')}
                  type="text"
                  id="identifier"
                  className={publicForm.inputTouch}
                  placeholder="you@example.com or 0551234567"
                />
                <p className={publicForm.hint}>Enter your email or Ghana phone number</p>
                {errors.identifier && <p className={publicForm.error}>{errors.identifier.message}</p>}
              </div>

              <div>
                <label htmlFor="password" className={publicForm.label}>
                  Password
                </label>
                <div className="relative">
                  <input
                    {...register('password')}
                    type={showPassword ? 'text' : 'password'}
                    id="password"
                    className={publicForm.passwordInput}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((v) => !v)}
                    className={publicForm.passwordToggle}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
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

              <button type="submit" disabled={loading} className={publicForm.submitTouch}>
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Signing in...
                  </>
                ) : (
                  'Sign In'
                )}
              </button>
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
