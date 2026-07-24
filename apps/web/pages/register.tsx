import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import apiClient from '@/lib/api-client';
import { getErrorMessage } from '@/lib/error-messages';
import { setAuthTokens, setUser } from '@/lib/auth';
import { AlertCircle, X, Check, User, Mail, Lock, Phone, MessageCircle, Eye, EyeOff } from 'lucide-react';
import PublicHeader from '@/components/PublicHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { publicForm } from '@/lib/form-classes';

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

  const [devCode, setDevCode] = useState<string | null>(null);

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
    } catch (err: any) {
      const message = getErrorMessage(err, 'Failed to send code');
      setError(message);
      setTimeout(() => document.getElementById('register-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' }), 100);
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

      const { user, accessToken, refreshToken } = response.data;

      setAuthTokens(accessToken, refreshToken);
      setUser(user);

      router.push('/dashboard');
    } catch (err: any) {
      const message = getErrorMessage(err, 'Registration failed. Please try again.');
      setError(message);
      // Scroll error into view so user sees why registration didn't progress
      setTimeout(() => {
        document.getElementById('register-error')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, 100);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <PublicHeader />
      <div className="min-h-screen bg-gradient-to-br from-[#1f1414] via-[#331518] to-[#160f10] flex items-center justify-center px-4 py-8">
        <div className="max-w-md w-full">
          <section className="relative mb-6 min-h-[160px] overflow-hidden rounded-[1.25rem] border border-white/10 bg-brand-maroon-black shadow-ios-card">
            <Image
              src="/images/v2/goods-services.jpg"
              alt=""
              fill
              priority
              sizes="(max-width: 768px) 100vw, 448px"
              className="object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/55 to-black/15" />
            <div className="relative z-10 flex min-h-[160px] flex-col justify-end p-5">
              <div className="mb-3 flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-brand-maroon-deep ring-2 ring-brand-gold/30">
                <Image src="/logo/MYXCROWLOGO.png" alt="MYXCROW" width={44} height={44} className="object-contain" />
              </div>
              <h1 className="text-3xl font-bold tracking-tight text-white">MYXCROW</h1>
              <p className="mt-1 text-sm font-medium text-brand-gold">Create your secure account</p>
              <p className="mt-1 text-xs leading-relaxed text-white/70">
                Join buyers and sellers who protect every deal with escrow.
              </p>
            </div>
          </section>

          {/* Main Card */}
          <div className="bg-white/95 rounded-2xl shadow-xl overflow-hidden border border-brand-gold/20">
            <div className="p-6 md:p-8">
              {/* Header */}
              <div className="text-center mb-6">
                <h2 className={publicForm.cardTitleLg}>Create Your Account</h2>
                <p className={publicForm.cardSubtitleMd}>Get started with MYXCROW in seconds</p>
              </div>

              {error && (
                <div id="register-error" className={publicForm.calloutErrorBanner} role="alert">
                  <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
                  <div className="flex-1">
                    <p className="text-sm font-medium text-red-800">{error}</p>
                  </div>
                  <button
                    onClick={() => setError(null)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              )}

              <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                {/* Name Fields */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="firstName" className={publicForm.label}>
                      <User className="w-4 h-4 inline mr-1" />
                      First Name
                    </label>
                    <Input
                      {...register('firstName')}
                      tone="light"
                      type="text"
                      id="firstName"
                      placeholder="John"
                      error={!!errors.firstName}
                    />
                    {errors.firstName && (
                      <p className={publicForm.error}>{errors.firstName.message}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="lastName" className={publicForm.label}>
                      Last Name
                    </label>
                    <Input
                      {...register('lastName')}
                      tone="light"
                      type="text"
                      id="lastName"
                      placeholder="Doe"
                      error={!!errors.lastName}
                    />
                    {errors.lastName && (
                      <p className={publicForm.error}>{errors.lastName.message}</p>
                    )}
                  </div>
                </div>

                {/* Email */}
                <div>
                  <label htmlFor="email" className={publicForm.label}>
                    <Mail className="w-4 h-4 inline mr-1" />
                    Email Address
                  </label>
                  <Input
                    {...register('email')}
                    tone="light"
                    type="email"
                    id="email"
                    placeholder="you@example.com"
                    error={!!errors.email}
                  />
                  {errors.email && (
                    <p className={publicForm.error}>{errors.email.message}</p>
                  )}
                </div>

                {/* Phone */}
                <div>
                  <label htmlFor="phone" className={publicForm.label}>
                    <Phone className="w-4 h-4 inline mr-1" />
                    Phone Number
                  </label>
                  <Input
                    {...register('phone')}
                    tone="light"
                    type="tel"
                    id="phone"
                    placeholder="0551234567"
                    error={!!errors.phone}
                  />
                  {errors.phone && (
                    <p className={publicForm.error}>{errors.phone.message}</p>
                  )}
                  <p className={publicForm.hint}>Ghana phone number (MTN, Vodafone, or AirtelTigo)</p>
                  {codeSent ? (
                    <div className="mt-3 space-y-2">
                      {devCode ? (
                        <div className={publicForm.calloutWarning}>
                          <p className="font-medium">SMS not configured – use this code to test:</p>
                          <p className="mt-1 font-mono text-lg tracking-widest">{devCode}</p>
                          <p className="mt-1 text-xs">Set OTP_DEV_BYPASS=false and configure Arkesel for real SMS.</p>
                        </div>
                      ) : (
                        <div className={publicForm.calloutSuccess}>
                          Code sent! Check your phone for the 6-digit verification code.
                        </div>
                      )}
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      fullWidth
                      className="mt-3"
                      onClick={onSendCode}
                      disabled={loading || countdown > 0 || !phone || !/^0[0-9]{9}$/.test(phone)}
                      loading={loading}
                    >
                      <MessageCircle className="w-4 h-4" />
                      {countdown > 0 ? `Resend in ${countdown}s` : 'Send verification code'}
                    </Button>
                  )}
                </div>

                {/* Verification Code - shown after code sent */}
                {codeSent && (
                  <div>
                    <label htmlFor="code" className={publicForm.label}>
                      Verification Code
                    </label>
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
                    {errors.code && (
                      <p className={publicForm.error}>{errors.code.message}</p>
                    )}
                    <p className={publicForm.hint}>Enter the 6-digit code sent to your phone</p>
                    <button
                      type="button"
                      onClick={onSendCode}
                      disabled={loading || countdown > 0}
                      className="mt-2 text-xs text-brand-maroon hover:underline font-medium disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {countdown > 0 ? `Resend code in ${countdown}s` : 'Resend code'}
                    </button>
                  </div>
                )}

                {/* Password */}
                <div>
                  <label htmlFor="password" className={publicForm.label}>
                    <Lock className="w-4 h-4 inline mr-1" />
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
                  {errors.password && (
                    <p className={publicForm.error}>{errors.password.message}</p>
                  )}
                  <p className={publicForm.hint}>Minimum 8 characters</p>
                </div>

                <Button
                  type="submit"
                  disabled={loading || !codeSent}
                  loading={loading}
                  variant="maroon"
                  fullWidth
                  size="lg"
                >
                  Create Account
                  {!loading && <Check className="w-5 h-5" />}
                </Button>
              </form>
            </div>

            {/* Footer */}
            <div className={publicForm.cardFooter}>
              <p className={`text-center ${publicForm.footerMuted}`}>
                By registering you agree to our{' '}
                <Link href="/terms" className="text-brand-maroon font-semibold hover:underline">Terms and Conditions</Link>
                {' '}and{' '}
                <Link href="/privacy" className="text-brand-maroon font-semibold hover:underline">Privacy Policy</Link>.
              </p>
              <p className={`text-center ${publicForm.footerText}`}>
                Already have an account?{' '}
                <Link href="/login" className="text-brand-maroon hover:text-brand-maroon-dark font-semibold transition-colors">
                  Sign in
                </Link>
              </p>
            </div>
          </div>

          {/* Security Note */}
          <p className="mt-6 text-center text-xs text-white/60 max-w-md mx-auto">
            Your information is secure. We use industry-standard encryption to protect your data.
          </p>
        </div>
      </div>
    </>
  );
}
