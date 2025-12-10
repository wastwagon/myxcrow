import { useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import apiClient from '@/lib/api-client';
import { setAuthTokens, setUser } from '@/lib/auth';
import { Loader2, AlertCircle, Upload, X, Check, ArrowRight, ArrowLeft, User, Mail, Lock, Phone, CreditCard, Camera, Shield } from 'lucide-react';
import SelfieCapture from '@/components/SelfieCapture';

const registerSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  phone: z
    .string()
    .min(10, 'Phone number must be at least 10 digits')
    .regex(/^(\+233|0)[0-9]{9}$/, 'Invalid Ghana phone number format (e.g., +233XXXXXXXXX or 0XXXXXXXXX)'),
  ghanaCardNumber: z
    .string()
    .min(1, 'Ghana Card number is required')
    .regex(/^GHA-[0-9]{9}-[0-9]$/, 'Invalid Ghana Card format (e.g., GHA-123456789-1)'),
  role: z.enum(['BUYER', 'SELLER']).default('BUYER'),
});

type RegisterFormData = z.infer<typeof registerSchema>;

export default function Register() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [cardFront, setCardFront] = useState<File | null>(null);
  const [cardBack, setCardBack] = useState<File | null>(null);
  const [selfie, setSelfie] = useState<File | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    trigger,
    getValues,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    mode: 'onChange',
  });

  const handleFileSelect = (file: File | null, type: 'cardFront' | 'cardBack' | 'selfie') => {
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    if (type === 'cardFront') {
      setCardFront(file);
    } else if (type === 'cardBack') {
      setCardBack(file);
    } else if (type === 'selfie') {
      setSelfie(file);
    }
    setError(null);
  };

  const validateStep1 = async () => {
    const isValid = await trigger(['firstName', 'lastName', 'email', 'phone', 'ghanaCardNumber', 'password']);
    if (isValid) {
      setStep(2);
      setError(null);
    }
  };

  const onSubmit = async (data: RegisterFormData) => {
    try {
      setLoading(true);
      setError(null);

      // Validate files
      if (!cardFront || !cardBack || !selfie) {
        setError('Please upload Ghana Card front, back, and selfie photo');
        setLoading(false);
        return;
      }

      // Create FormData for multipart/form-data
      const formData = new FormData();
      formData.append('email', data.email);
      formData.append('password', data.password);
      formData.append('firstName', data.firstName);
      formData.append('lastName', data.lastName);
      formData.append('phone', data.phone);
      formData.append('ghanaCardNumber', data.ghanaCardNumber);
      formData.append('role', data.role || 'BUYER');
      
      // Append files with specific field names
      formData.append('files', cardFront, 'card-front.jpg');
      formData.append('files', cardBack, 'card-back.jpg');
      formData.append('files', selfie, 'selfie.jpg');

      setProcessing(true);
      const response = await apiClient.post('/auth/register', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      const { user, accessToken, refreshToken, faceMatchScore } = response.data;

      setAuthTokens(accessToken, refreshToken);
      setUser(user);

      // Show success message with face match score
      if (faceMatchScore) {
        alert(
          `Registration successful! Face match score: ${(faceMatchScore * 100).toFixed(1)}%.\n` +
            'Your account is pending admin verification. You can access your dashboard but cannot perform transactions until approved.',
        );
      }

      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally {
      setLoading(false);
      setProcessing(false);
    }
  };

  const canProceedToStep2 = () => {
    const values = getValues();
    return (
      values.firstName &&
      values.lastName &&
      values.email &&
      values.phone &&
      values.ghanaCardNumber &&
      values.password &&
      !errors.firstName &&
      !errors.lastName &&
      !errors.email &&
      !errors.phone &&
      !errors.ghanaCardNumber &&
      !errors.password
    );
  };

  const canSubmit = () => {
    return cardFront && cardBack && selfie && canProceedToStep2();
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center px-4 py-8">
      <div className="max-w-2xl w-full">
        {/* Branding Header */}
        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mb-4 shadow-lg">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            MYXCROW
          </h1>
          <p className="text-base font-semibold text-gray-700 mb-1">
            Secure Escrow Services for Safe Transactions
          </p>
        </div>

        {/* Main Card */}
        <div className="bg-white rounded-2xl shadow-xl overflow-hidden">
          <div className="p-6 md:p-8">
            {/* Header */}
            <div className="text-center mb-6">
              <h2 className="text-2xl md:text-3xl font-bold text-gray-900 mb-2">
                Create Your Account
              </h2>
              <p className="text-gray-600 text-sm md:text-base">
                {step === 1 
                  ? 'Enter your basic information to get started' 
                  : 'Verify your identity with Ghana Card and selfie'}
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

            {/* Step 1: Account Details */}
            {step === 1 && (
              <form onSubmit={(e) => { e.preventDefault(); validateStep1(); }} className="space-y-5">
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
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
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
                      className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
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
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
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
                    Phone Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('phone')}
                    type="tel"
                    id="phone"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                    placeholder="+233XXXXXXXXX or 0XXXXXXXXX"
                  />
                  {errors.phone && (
                    <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">Ghana phone number (MTN, Vodafone, or AirtelTigo)</p>
                </div>

                {/* Ghana Card Number */}
                <div>
                  <label htmlFor="ghanaCardNumber" className="block text-sm font-semibold text-gray-700 mb-2">
                    <CreditCard className="w-4 h-4 inline mr-1" />
                    Ghana Card Number <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('ghanaCardNumber')}
                    type="text"
                    id="ghanaCardNumber"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none uppercase"
                    placeholder="GHA-123456789-1"
                    maxLength={15}
                  />
                  {errors.ghanaCardNumber && (
                    <p className="mt-1 text-sm text-red-600">{errors.ghanaCardNumber.message}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">Format: GHA-XXXXXXXXX-X</p>
                </div>

                {/* Account Type */}
                <div>
                  <label htmlFor="role" className="block text-sm font-semibold text-gray-700 mb-2">
                    Account Type <span className="text-red-500">*</span>
                  </label>
                  <select
                    {...register('role')}
                    id="role"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none bg-white"
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
                    Password <span className="text-red-500">*</span>
                  </label>
                  <input
                    {...register('password')}
                    type="password"
                    id="password"
                    className="w-full px-4 py-3 border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none"
                    placeholder="••••••••"
                  />
                  {errors.password && (
                    <p className="mt-1 text-sm text-red-600">{errors.password.message}</p>
                  )}
                  <p className="mt-1 text-xs text-gray-500">Minimum 8 characters</p>
                </div>

                {/* Continue Button */}
                <button
                  type="submit"
                  disabled={!canProceedToStep2()}
                  className="w-full py-3 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold transition-all shadow-lg hover:shadow-xl"
                >
                  Continue to Verification
                  <ArrowRight className="w-5 h-5" />
                </button>
              </form>
            )}

            {/* Step 2: Identity Verification */}
            {step === 2 && (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                {/* Processing Indicator */}
                {processing && (
                  <div className="p-4 bg-blue-50 border-2 border-blue-200 rounded-xl">
                    <div className="flex items-center gap-3 text-blue-700">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      <div>
                        <p className="text-sm font-semibold">Verifying your identity...</p>
                        <p className="text-xs text-blue-600 mt-1">
                          Comparing your selfie with Ghana Card photo. This may take a few seconds.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Ghana Card Front */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <CreditCard className="w-4 h-4 inline mr-1" />
                    Ghana Card Front <span className="text-red-500">*</span>
                  </label>
                  {cardFront ? (
                    <div className="relative">
                      <img
                        src={URL.createObjectURL(cardFront)}
                        alt="Card front preview"
                        className="w-full h-48 md:h-64 object-contain rounded-xl border-2 border-green-500 bg-gray-50"
                      />
                      <button
                        type="button"
                        onClick={() => setCardFront(null)}
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="absolute bottom-2 left-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Uploaded
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-40 md:h-48 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 hover:border-blue-400 transition-all group">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-10 h-10 mb-3 text-gray-400 group-hover:text-blue-500 transition-colors" />
                        <p className="mb-2 text-sm font-medium text-gray-600 group-hover:text-blue-600">
                          Click to upload front of Ghana Card
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileSelect(e.target.files?.[0] || null, 'cardFront')}
                      />
                    </label>
                  )}
                  <p className="mt-2 text-xs text-gray-500">Upload a clear photo of the front of your Ghana Card</p>
                </div>

                {/* Ghana Card Back */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <CreditCard className="w-4 h-4 inline mr-1" />
                    Ghana Card Back <span className="text-red-500">*</span>
                  </label>
                  {cardBack ? (
                    <div className="relative">
                      <img
                        src={URL.createObjectURL(cardBack)}
                        alt="Card back preview"
                        className="w-full h-48 md:h-64 object-contain rounded-xl border-2 border-green-500 bg-gray-50"
                      />
                      <button
                        type="button"
                        onClick={() => setCardBack(null)}
                        className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors shadow-lg"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      <div className="absolute bottom-2 left-2 bg-green-500 text-white px-3 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                        <Check className="w-3 h-3" />
                        Uploaded
                      </div>
                    </div>
                  ) : (
                    <label className="flex flex-col items-center justify-center w-full h-40 md:h-48 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer hover:bg-gray-50 hover:border-blue-400 transition-all group">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-10 h-10 mb-3 text-gray-400 group-hover:text-blue-500 transition-colors" />
                        <p className="mb-2 text-sm font-medium text-gray-600 group-hover:text-blue-600">
                          Click to upload back of Ghana Card
                        </p>
                        <p className="text-xs text-gray-500">PNG, JPG up to 5MB</p>
                      </div>
                      <input
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => handleFileSelect(e.target.files?.[0] || null, 'cardBack')}
                      />
                    </label>
                  )}
                  <p className="mt-2 text-xs text-gray-500">Upload a clear photo of the back of your Ghana Card</p>
                </div>

                {/* Selfie Capture */}
                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-2">
                    <Camera className="w-4 h-4 inline mr-1" />
                    Selfie Photo <span className="text-red-500">*</span>
                  </label>
                  <SelfieCapture
                    onCapture={(file) => handleFileSelect(file, 'selfie')}
                    onRemove={() => setSelfie(null)}
                    value={selfie}
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    disabled={loading}
                    className="flex-1 py-3 px-6 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold transition-all"
                  >
                    <ArrowLeft className="w-5 h-5" />
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !canSubmit()}
                    className="flex-1 py-3 px-6 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold transition-all shadow-lg hover:shadow-xl"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="w-5 h-5 animate-spin" />
                        {processing ? 'Verifying...' : 'Creating Account...'}
                      </>
                    ) : (
                      <>
                        Create Account
                        <Check className="w-5 h-5" />
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Footer */}
          <div className="bg-gray-50 px-6 md:px-8 py-4 border-t border-gray-200">
            <p className="text-center text-sm text-gray-600">
              Already have an account?{' '}
              <Link href="/login" className="text-blue-600 hover:text-blue-700 font-semibold transition-colors">
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
  );
}
