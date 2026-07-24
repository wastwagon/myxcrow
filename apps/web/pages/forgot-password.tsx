import { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import apiClient from '@/lib/api-client';
import { AlertCircle, Smartphone } from 'lucide-react';
import PublicHeader from '@/components/PublicHeader';
import { Button, ButtonLink } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { publicForm } from '@/lib/form-classes';

const schema = z.object({
  identifier: z.string().min(1, 'Enter email or phone').refine(
    (val) => /^(\+?233[0-9]{9}|0[0-9]{9})$/.test(val.replace(/\s/g, '')) || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val),
    'Enter email or Ghana phone (e.g. 0551234567)',
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
        <section className="relative mb-6 min-h-[140px] overflow-hidden rounded-[1.25rem] border border-white/10 bg-brand-maroon-black shadow-ios-card">
          <Image
            src="/images/v2/local-transactions.jpg"
            alt=""
            fill
            priority
            sizes="(max-width: 768px) 100vw, 448px"
            className="object-cover object-center"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-black/20" />
          <div className="relative z-10 flex min-h-[140px] flex-col justify-end p-5">
            <div className="mb-3 flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-brand-maroon-deep ring-2 ring-brand-gold/30">
              <Image src="/logo/MYXCROWLOGO.png" alt="MYXCROW" width={44} height={44} className="object-contain" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-white">Reset password</h1>
            <p className="mt-1 text-xs leading-relaxed text-white/70">
              Enter your email or phone — we&apos;ll text a reset link to the phone on your account.
            </p>
          </div>
        </section>

        <div className="bg-white/95 rounded-2xl shadow-xl p-6 md:p-8 border border-brand-gold/20">
          {error && (
            <div className={publicForm.calloutError}>
              <AlertCircle className="w-5 h-5" />
              <span className="text-sm">{error}</span>
            </div>
          )}

          {sent ? (
            <div className="space-y-4">
              <div className={publicForm.calloutSuccess}>
                If an account exists with a phone number on file, an SMS with your reset link has been sent. Open the link on your phone to set a new password.
              </div>
              <ButtonLink href="/login" variant="maroon" fullWidth size="lg">
                Back to login
              </ButtonLink>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              <div>
                <label htmlFor="identifier" className={publicForm.label}>
                  <Smartphone className="w-4 h-4 inline mr-1" />
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
                <p className={publicForm.hint}>
                  Reset link is sent by SMS to the phone number registered on your account
                </p>
                {errors.identifier && (
                  <p className={publicForm.error}>{errors.identifier.message}</p>
                )}
              </div>

              <Button type="submit" disabled={loading} loading={loading} variant="maroon" fullWidth size="lg">
                Send reset link via SMS
              </Button>

              <div className={`text-center ${publicForm.footerText}`}>
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
