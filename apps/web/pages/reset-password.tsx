import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import apiClient from '@/lib/api-client';
import { Loader2, AlertCircle, Lock } from 'lucide-react';
import PublicHeader from '@/components/PublicHeader';
import { publicForm } from '@/lib/form-classes';

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
    } catch (err: any) {
      setError(err.response?.data?.message || 'Failed to reset password. Please try again.');
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
          <h1 className="text-3xl font-bold mb-2 text-white">
            Set a new password
          </h1>
          <p className="text-sm text-white/70">
            Choose a strong password you don’t use elsewhere.
          </p>
        </div>

        <div className="bg-white/95 rounded-2xl shadow-xl p-6 md:p-8 border border-brand-gold/20">
          {error && (
            <div className={publicForm.calloutError}>
              <AlertCircle className="w-5 h-5 shrink-0" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {done ? (
            <div className="space-y-4">
              <div className={publicForm.calloutSuccess}>
                Password reset successful. A confirmation SMS has been sent to your phone. You can now sign in.
              </div>
              <button type="button" onClick={() => router.push('/login')} className={publicForm.submitMaroon}>
                Go to login
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {!tokenFromQuery && (
                <div>
                  <label htmlFor="token" className={publicForm.label}>
                    Reset Token
                  </label>
                  <input
                    {...register('token')}
                    type="text"
                    id="token"
                    className={publicForm.input}
                    placeholder="Paste token from your email or SMS link"
                  />
                  {errors.token && <p className={publicForm.error}>{errors.token.message}</p>}
                </div>
              )}
              {tokenFromQuery && <input type="hidden" {...register('token')} />}

              <div>
                <label htmlFor="newPassword" className={publicForm.label}>
                  <Lock className="w-4 h-4 inline mr-1" />
                  New Password
                </label>
                <input
                  {...register('newPassword')}
                  type="password"
                  id="newPassword"
                  className={publicForm.input}
                  placeholder="••••••••"
                />
                {errors.newPassword && <p className={publicForm.error}>{errors.newPassword.message}</p>}
              </div>

              <div>
                <label htmlFor="confirmPassword" className={publicForm.label}>
                  Confirm Password
                </label>
                <input
                  {...register('confirmPassword')}
                  type="password"
                  id="confirmPassword"
                  className={publicForm.input}
                  placeholder="••••••••"
                />
                {errors.confirmPassword && (
                  <p className={publicForm.error}>{errors.confirmPassword.message}</p>
                )}
              </div>

              <button type="submit" disabled={loading} className={publicForm.submit}>
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Resetting...
                  </>
                ) : (
                  'Reset password'
                )}
              </button>

              <div className={`text-center ${publicForm.footerText}`}>
                <Link href="/login" className="text-brand-maroon hover:text-brand-maroon-dark font-semibold">
                  Back to login
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

