import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import apiClient from '@/lib/api-client';
import { Loader2, AlertCircle, Mail } from 'lucide-react';
import PublicHeader from '@/components/PublicHeader';

const schema = z.object({
  email: z.string().email('Invalid email address'),
});

type FormData = z.infer<typeof schema>;

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: FormData) => {
    try {
      setLoading(true);
      setError(null);
      await apiClient.post('/auth/password-reset/request', { email: data.email });
      setSent(true);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to request password reset. Please try again.');
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
            <Image src="/logo/website-logo.gif" alt="MYXCROW" width={64} height={64} className="object-contain" unoptimized />
          </div>
          <h1 className="text-3xl font-bold mb-2 text-white">
            Reset Password
          </h1>
          <p className="text-sm text-white/70">
            Enter your email and we’ll send you a reset link.
          </p>
        </div>

        <div className="bg-white/95 rounded-2xl shadow-xl p-6 md:p-8 border border-brand-gold/20">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-red-700">
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {sent ? (
            <div className="space-y-4">
              <div className="p-4 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
                If an account exists for that email, a reset link has been sent.
              </div>
              <button
                onClick={() => router.push('/login')}
                className="w-full py-3 px-6 bg-brand-maroon text-white rounded-xl hover:bg-brand-maroon-dark font-semibold"
              >
                Back to login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label htmlFor="email" className="block text-sm font-semibold text-gray-700 mb-2">
                  <Mail className="w-4 h-4 inline mr-1" />
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

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3 px-6 bg-gradient-to-r from-brand-maroon to-brand-maroon-dark text-white rounded-xl hover:from-brand-maroon-dark hover:to-brand-maroon-darker disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold transition-all shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send reset link'
                )}
              </button>

              <div className="text-center text-sm text-gray-600">
                Remembered your password?{' '}
                <Link href="/login" className="text-brand-maroon hover:text-brand-maroon-dark font-semibold">
                  Sign in
                </Link>
              </div>
            </form>
          )}
          </div>
        </div>
      </div>
    </>
  );
}

