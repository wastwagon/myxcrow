import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { isAuthenticated, getUser, setUser } from '@/lib/auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { User, Mail, Phone, Calendar, Shield, Edit2, Save, X, Loader2, Key } from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import PageHeader from '@/components/PageHeader';

interface ProfileData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  roles?: string[];
  kycStatus?: string;
  createdAt?: string;
}

export default function ProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const user = getUser();
  const [isEditing, setIsEditing] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('phone_required') === '1') {
      setIsEditing(true);
    }
  }, []);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
    }
  }, [router]);

  const { data: profile, isLoading } = useQuery<ProfileData>({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await apiClient.get('/auth/profile');
      return response.data;
    },
  });

  const { register, handleSubmit, formState: { errors }, reset } = useForm<{
    firstName: string;
    lastName: string;
    phone: string;
  }>({
    defaultValues: {
      firstName: profile?.firstName || '',
      lastName: profile?.lastName || '',
      phone: profile?.phone || '',
    },
  });

  // Update form when profile loads
  useEffect(() => {
    if (profile) {
      reset({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        phone: profile.phone || '',
      });
    }
  }, [profile, reset]);

  const updateMutation = useMutation({
    mutationFn: async (data: { firstName?: string; lastName?: string; phone?: string }) => {
      const response = await apiClient.put('/auth/profile', data);
      return response.data;
    },
    onSuccess: (data) => {
      // Update local storage
      const updatedUser = { ...user, ...data };
      setUser(updatedUser);
      queryClient.invalidateQueries({ queryKey: ['profile'] });
      setIsEditing(false);
      toast.success('Profile updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update profile');
    },
  });

  const onSubmit = (data: { firstName: string; lastName: string; phone: string }) => {
    updateMutation.mutate({
      firstName: data.firstName || undefined,
      lastName: data.lastName || undefined,
      phone: data.phone?.trim() ? data.phone.trim() : undefined,
    });
  };

  const handleCancel = () => {
    reset({
      firstName: profile?.firstName || '',
      lastName: profile?.lastName || '',
      phone: profile?.phone || '',
    });
    setIsEditing(false);
  };

  if (!isAuthenticated()) {
    return null;
  }

  const displayUser = profile || user;
  const phoneRequired = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('phone_required') === '1';

  return (
    <Layout>
      {phoneRequired && !displayUser?.phone && (
        <div className="mb-4 p-4 bg-amber-50 border border-amber-200 rounded-lg text-amber-800">
          <p className="font-medium">Phone number required</p>
          <p className="text-sm mt-1">Add your Ghana phone number below to use escrows, payments, and other features.</p>
        </div>
      )}
      <div className="max-w-2xl mx-auto">
        <PageHeader
          title="Profile"
          subtitle="Manage your account information"
          icon={<User className="w-6 h-6 text-white" />}
          gradient="blue"
          action={
            !isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 bg-white/20 backdrop-blur-sm text-white rounded-lg hover:bg-white/30 font-medium shadow-lg transition-all border border-white/30 flex items-center gap-2"
              >
                <Edit2 className="w-4 h-4" />
                Edit Profile
              </button>
            ) : undefined
          }
        />

        <div className="bg-white rounded-lg shadow p-6 space-y-6">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-gray-200 animate-pulse rounded" />
              ))}
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4 pb-6 border-b">
                <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-xl">
                  {(displayUser?.phone || displayUser?.email)?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-gray-900">{displayUser?.phone || displayUser?.email}</h2>
                  {displayUser?.firstName && displayUser?.lastName && (
                    <p className="text-gray-500 text-sm">
                      {displayUser.firstName} {displayUser.lastName}
                    </p>
                  )}
                </div>
              </div>

              {isEditing ? (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-gray-700 mb-1">
                      First Name
                    </label>
                    <input
                      {...register('firstName')}
                      type="text"
                      id="firstName"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your first name"
                    />
                    {errors.firstName && (
                      <p className="mt-1 text-sm text-red-600">{errors.firstName.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      {...register('lastName')}
                      type="text"
                      id="lastName"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="Enter your last name"
                    />
                    {errors.lastName && (
                      <p className="mt-1 text-sm text-red-600">{errors.lastName.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                      Phone Number (Ghana) *
                    </label>
                    <input
                      {...register('phone', {
                        pattern: {
                          value: /^0[0-9]{9}$/,
                          message: 'Enter Ghana phone (e.g. 0551234567)',
                        },
                      })}
                      type="tel"
                      id="phone"
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0551234567"
                    />
                    <p className="mt-1 text-xs text-gray-500">Format: 0XXXXXXXXX (no +233)</p>
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-600">{errors.phone.message}</p>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={updateMutation.isPending}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {updateMutation.isPending ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <Save className="w-4 h-4" />
                          Save Changes
                        </>
                      )}
                    </button>
                    <button
                      type="button"
                      onClick={handleCancel}
                      disabled={updateMutation.isPending}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <Phone className="w-5 h-5 text-gray-400 mt-1" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-medium text-gray-900">{displayUser?.phone || 'Not set'}</p>
                      {!displayUser?.phone && (
                        <p className="text-xs text-amber-600 mt-1">Add your phone to use escrows and payments</p>
                      )}
                    </div>
                  </div>

                  {displayUser?.email && (
                    <div className="flex items-start gap-4">
                      <Mail className="w-5 h-5 text-gray-400 mt-1" />
                      <div className="flex-1">
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-medium text-gray-900">{displayUser.email}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-4">
                    <User className="w-5 h-5 text-gray-400 mt-1" />
                    <div className="flex-1">
                      <p className="text-sm text-gray-600">Name</p>
                      {displayUser?.firstName || displayUser?.lastName ? (
                        <p className="font-medium text-gray-900">
                          {displayUser.firstName || ''} {displayUser.lastName || ''}
                        </p>
                      ) : (
                        <p className="text-gray-500 italic">Not set - Click Edit to add your name</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <Calendar className="w-5 h-5 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-600">Member Since</p>
                      <p className="font-medium text-gray-900">
                        {profile?.createdAt ? formatDate(profile.createdAt) : 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <Shield className="w-5 h-5 text-gray-400 mt-1" />
                    <div>
                      <p className="text-sm text-gray-600">Roles</p>
                      <div className="flex gap-2 mt-1">
                        {displayUser?.roles?.map((role: string) => (
                          <span
                            key={role}
                            className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded"
                          >
                            {role}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {/* Security Section - Always visible outside editing mode */}
              {!isEditing && (
                <div className="mt-8 pt-6 border-t border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Security</h3>
                  <Link
                    href="/change-password"
                    className="flex items-center gap-3 p-4 bg-gray-50 hover:bg-gray-100 rounded-lg transition border border-gray-200"
                  >
                    <Key className="w-5 h-5 text-gray-600" />
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">Change Password</p>
                      <p className="text-sm text-gray-600">Update your account password</p>
                    </div>
                    <span className="text-gray-400">→</span>
                  </Link>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </Layout>
  );
}
