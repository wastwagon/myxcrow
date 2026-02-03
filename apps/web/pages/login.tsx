import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import apiClient from '@/lib/api-client';
import { setAuthTokens, setUser } from '@/lib/auth';
import { Loader2, AlertCircle } from 'lucide-react';
import PublicHeader from '@/components/PublicHeader';

const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export default function Login() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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
      const response = await apiClient.post('/auth/login', data);
      const { user, accessToken, refreshToken } = response.data;

      setAuthTokens(accessToken, refreshToken);
      setUser(user);

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PublicHeader />
      <div className="min-h-screen bg-gradient-to-br from-[#1f1414] via-[#331518] to-[#160f10] flex items-center justify-center px-4 py-8">
        <div className="max-w-md w-full">
          {/* Branding Header */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg overflow-hidden bg-brand-maroon-deep">
              <Image src="/logo/website-logo.gif" alt="MYXCROW" width={64} height={64} className="object-contain" unoptimized />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-2 text-white">
              MYXCROW
            </h1>
            <p className="text-lg font-semibold text-brand-gold mb-1">
              Secure Escrow Services for Safe Transactions
            </p>
            <p className="text-sm text-white/70 max-w-md mx-auto">
              Protect your payments with our trusted escrow platform. Funds are held securely until both parties are satisfied.
            </p>
          </div>

          {/* Login Card */}
          <div className="bg-white/95 rounded-2xl shadow-xl p-6 md:p-8 border border-brand-gold/20">
          <div className="text-center mb-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Sign In</h2>
            <p className="text-gray-600 text-sm">Access your escrow account</p>
          </div>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
            <AlertCircle className="w-5 h-5" />
            <span className="text-sm">{error}</span>
          </div>
        )}

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
            <div>
              <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                Email Address
              </label>
              <input
                {...register('email')}
                type="email"
                id="email"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-brand-gold transition-all outline-none"
                placeholder="you@example.com"
              />
              {errors.email && (
                <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
              )}
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                Password
              </label>
              <input
                {...register('password')}
                type="password"
                id="password"
                className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-brand-gold transition-all outline-none"
                placeholder="••••••••"
              />
              {errors.password && (
                <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
              )}
              <div className="mt-2 text-right">
                <Link
                  href="/forgot-password"
                  className="text-sm font-semibold text-brand-maroon hover:text-brand-maroon-dark"
                >
                  Forgot password?
                </Link>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-6 bg-gradient-to-r from-brand-maroon to-brand-maroon-dark text-white rounded-xl hover:from-brand-maroon-dark hover:to-brand-maroon-darker focus:outline-none focus:ring-2 focus:ring-brand-gold focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold transition-all shadow-lg hover:shadow-xl"
            >
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

          <div className="mt-6 pt-6 border-t border-gray-200 text-center space-y-2">
            <p className="text-xs text-gray-500">
              <Link href="/terms" className="text-brand-maroon font-semibold hover:underline">Terms</Link>
              {' · '}
              <Link href="/privacy" className="text-brand-maroon font-semibold hover:underline">Privacy</Link>
            </p>
            <p className="text-sm text-gray-600">
              Don&apos;t have an account?{' '}
              <Link href="/register" className="text-brand-maroon hover:text-brand-maroon-dark font-semibold transition-colors">
                Sign up
              </Link>
            </p>
          </div>
        </div>

          {/* Security Note */}
          <p className="mt-6 text-center text-xs text-white/60 max-w-md mx-auto">
            🔒 Your information is secure. We use industry-standard encryption to protect your data.
          </p>
        </div>
      </div>
    </>
  );
}

