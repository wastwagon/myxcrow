import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Image from 'next/image';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import apiClient from '@/lib/api-client';
import { setAuthTokens, setUser } from '@/lib/auth';
import { Loader2, AlertCircle, X, Check, User, Mail, Lock, Phone, MessageCircle } from 'lucide-react';
import PublicHeader from '@/components/PublicHeader';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z.string().regex(/^0[0-9]{9}$/, 'Enter Ghana phone (e.g. 0551234567)'),
  code: z.string().length(6, 'Enter the 6-digit code').optional(),
  role: z.enum(['BUYER', 'SELLER']).default('BUYER'),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function Register() {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [codeSent, setCodeSent] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
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
      await apiClient.post('/auth/send-phone-otp', { phone: p });
      setCodeSent(true);
    } catch (err: any) {
      const msg = err.response?.data?.message;
      setError(Array.isArray(msg) ? msg.join('. ') : typeof msg === 'string' ? msg : 'Failed to send code');
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
        role: data.role || 'BUYER',
      });

      const { user, accessToken, refreshToken } = response.data;

      setAuthTokens(accessToken, refreshToken);
      setUser(user);

      router.push('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.message;
      setError(
        Array.isArray(msg) ? msg.join('. ') : typeof msg === 'string' ? msg : 'Registration failed. Please try again.'
      );
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
          <div className="text-center mb-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl mb-4 shadow-lg overflow-hidden bg-brand-maroon-deep">
              <Image src="/logo/website-logo.gif" alt="MYXCROW" width={64} height={64} className="object-contain" unoptimized />
            </div>
            <h1 className="text-3xl md:text-4xl font-bold mb-2 text-white">
              MYXCROW
            </h1>
            <p className="text-base font-semibold text-brand-gold mb-1">
              Secure Escrow Services for Safe Transactions
            </p>
          </div>

          {/* Main Card */}
          <div className="bg-white/95 rounded-2xl shadow-xl overflow-hidden border border-brand-gold/20">
            <div className="p-6 md:p-8">
              {/* Header */}
              <div className="text-center mb-6">
                <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                  Create Your Account
                </h2>
                <p className="text-gray-600 text-sm md:text-base">
                  Get started with MYXCROW in seconds
                </p>
              </div>

              {error && (
                <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 rounded-lg flex items-start gap-3">
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
                    <label htmlFor="firstName" className="block text-sm font-semibold text-gray-700 mb-2">
                      <User className="w-4 h-4 inline mr-1" />
                      First Name
                    </label>
                    <input
                      {...register('firstName')}
                      type="text"
                      id="firstName"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-brand-gold transition-all outline-none"
                      placeholder="John"
                    />
                    {errors.firstName && (
                      <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                    )}
                  </div>
                  <div>
                    <label htmlFor="lastName" className="block text-sm font-semibold text-gray-700 mb-2">
                      Last Name
                    </label>
                    <input
                      {...register('lastName')}
                      type="text"
                      id="lastName"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-brand-gold transition-all outline-none"
                      placeholder="Doe"
                    />
                    {errors.lastName && (
                      <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                    )}
                  </div>
                </div>

                {/* Email */}
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

                {/* Phone */}
                <div>
                  <label htmlFor="phone" className="block text-sm font-semibold text-gray-700 mb-2">
                    <Phone className="w-4 h-4 inline mr-1" />
                    Phone Number
                  </label>
                  <input
                    {...register('phone')}
                    type="tel"
                    id="phone"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-brand-gold transition-all outline-none"
                    placeholder="0551234567"
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">Ghana phone number (MTN, Vodafone, or AirtelTigo)</p>
                  {codeSent ? (
                    <div className="mt-3 p-3 bg-green-50 border border-green-200 rounded-lg text-green-800 text-sm">
                      Code sent! Check your phone for the 6-digit verification code.
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={onSendCode}
                      disabled={loading || !phone || !/^0[0-9]{9}$/.test(phone)}
                      className="mt-3 w-full py-2 px-4 border-2 border-brand-maroon text-brand-maroon rounded-xl hover:bg-brand-maroon/5 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                    >
                      <MessageCircle className="w-4 h-4" />
                      {loading ? 'Sending...' : 'Send verification code'}
                    </button>
                  )}
                </div>

                {/* Verification Code - shown after code sent */}
                {codeSent && (
                  <div>
                    <label htmlFor="code" className="block text-sm font-semibold text-gray-700 mb-2">
                      Verification Code
                    </label>
                    <input
                      {...register('code')}
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      id="code"
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-brand-gold transition-all outline-none text-center text-lg tracking-widest"
                      placeholder="000000"
                    />
                    {errors.code && (
                      <p className="mt-1 text-sm text-red-600">{errors.code.message}</p>
                    )}
                    <p className="mt-1 text-xs text-gray-500">Enter the 6-digit code sent to your phone</p>
                    <button
                      type="button"
                      onClick={onSendCode}
                      disabled={loading}
                      className="mt-2 text-xs text-brand-maroon hover:underline font-medium disabled:opacity-50"
                    >
                      Resend code
                    </button>
                  </div>
                )}

                {/* Account Type */}
                <div>
                  <label htmlFor="role" className="block text-sm font-semibold text-gray-700 mb-2">
                    Account Type
                  </label>
                  <select
                    {...register('role')}
                    id="role"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-gold focus:border-brand-gold transition-all outline-none bg-white"
                  >
                    <option value="BUYER">Buyer - I want to purchase goods/services</option>
                    <option value="SELLER">Seller - I want to sell goods/services</option>
                  </select>
                  {errors.role && (
                    <p className="mt-1 text-sm text-red-600">{errors.role.message}</p>
                  )}
                </div>

                {/* Password */}
                <div>
                  <label htmlFor="password" className="block text-sm font-semibold text-gray-700 mb-2">
                    <Lock className="w-4 h-4 inline mr-1" />
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
                  <p className="mt-1 text-xs text-gray-500">Minimum 8 characters</p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading || !codeSent}
                  className="w-full py-3 px-6 bg-gradient-to-r from-brand-maroon to-brand-maroon-dark text-white rounded-xl hover:from-brand-maroon-dark hover:to-brand-maroon-darker focus:outline-none focus:ring-2 focus:ring-brand-gold focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold transition-all shadow-lg hover:shadow-xl"
                >
                  {loading ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Creating Account...
                    </>
                  ) : (
                    <>
                      Create Account
                      <Check className="w-5 h-5" />
                    </>
                  )}
                </button>
              </form>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-6 md:px-8 py-4 border-t border-gray-200 space-y-2">
              <p className="text-center text-xs text-gray-500">
                By registering you agree to our{' '}
                <Link href="/terms" className="text-brand-maroon font-semibold hover:underline">Terms and Conditions</Link>
                {' '}and{' '}
                <Link href="/privacy" className="text-brand-maroon font-semibold hover:underline">Privacy Policy</Link>.
              </p>
              <p className="text-center text-sm text-gray-600">
                Already have an account?{' '}
                <Link href="/login" className="text-brand-maroon hover:text-blue-700 font-semibold transition-colors">
                  Sign in
                </Link>
              </p>
            </div>
          </div>

          {/* Security Note */}
          <p className="mt-6 text-center text-xs text-gray-500 max-w-md mx-auto">
            🔒 Your information is secure. We use industry-standard encryption to protect your data.
          </p>
        </div>
      </div>
    </>
  );
}
