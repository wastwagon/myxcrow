import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { isAuthenticated, getUser, setUser } from '@/lib/auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { getErrorMessage } from '@/lib/error-messages';
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
      toast.error(getErrorMessage(error, 'Failed to update profile'));
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
        <div className="mb-4 p-4 bg-amber-500/20 border border-amber-500/40 rounded-xl text-amber-200">
          <p className="font-medium">Phone number required</p>
          <p className="text-sm mt-1 opacity-90">Add your Ghana phone number below to use escrows, payments, and other features.</p>
        </div>
      )}
      <div className="max-w-2xl mx-auto">
        <PageHeader
          title="Profile"
          subtitle="Manage your account information"
          icon={<User className="w-6 h-6" />}
          action={
            !isEditing ? (
              <button
                onClick={() => setIsEditing(true)}
                className="px-4 py-2 min-h-[48px] bg-brand-gold/20 text-brand-gold rounded-xl hover:bg-brand-gold/30 font-medium shadow-lg transition-all border border-brand-gold/40 flex items-center gap-2 touch-manipulation"
              >
                <Edit2 className="w-4 h-4" />
                Edit Profile
              </button>
            ) : undefined
          }
        />

        <div className="bg-white/[0.07] backdrop-blur-sm rounded-xl border border-white/10 p-6 space-y-6 shadow-xl shadow-black/10">
          {isLoading ? (
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-16 bg-white/10 animate-pulse rounded-xl" />
              ))}
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4 pb-6 border-b border-white/10">
                <div className="w-16 h-16 bg-gradient-to-br from-brand-gold to-amber-600 rounded-full flex items-center justify-center text-brand-maroon-black font-bold text-xl ring-2 ring-brand-gold/40">
                  {(displayUser?.phone || displayUser?.email)?.[0]?.toUpperCase() || 'U'}
                </div>
                <div>
                  <h2 className="text-2xl font-semibold text-white">{displayUser?.phone || displayUser?.email}</h2>
                  {displayUser?.firstName && displayUser?.lastName && (
                    <p className="text-white/70 text-sm">
                      {displayUser.firstName} {displayUser.lastName}
                    </p>
                  )}
                </div>
              </div>

              {isEditing ? (
                <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                  <div>
                    <label htmlFor="firstName" className="block text-sm font-medium text-white/80 mb-1">
                      First Name
                    </label>
                    <input
                      {...register('firstName')}
                      type="text"
                      id="firstName"
                      className="w-full px-4 py-2 border border-white/20 rounded-lg bg-white/5 text-white placeholder-white/50 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold/50"
                      placeholder="Enter your first name"
                    />
                    {errors.firstName && (
                      <p className="mt-1 text-sm text-red-400">{errors.firstName.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="lastName" className="block text-sm font-medium text-white/80 mb-1">
                      Last Name
                    </label>
                    <input
                      {...register('lastName')}
                      type="text"
                      id="lastName"
                      className="w-full px-4 py-2 border border-white/20 rounded-lg bg-white/5 text-white placeholder-white/50 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold/50"
                      placeholder="Enter your last name"
                    />
                    {errors.lastName && (
                      <p className="mt-1 text-sm text-red-400">{errors.lastName.message}</p>
                    )}
                  </div>

                  <div>
                    <label htmlFor="phone" className="block text-sm font-medium text-white/80 mb-1">
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
                      className="w-full px-4 py-2 border border-white/20 rounded-lg bg-white/5 text-white placeholder-white/50 focus:ring-2 focus:ring-brand-gold focus:border-brand-gold/50"
                      placeholder="0551234567"
                    />
                    <p className="mt-1 text-xs text-white/50">Format: 0XXXXXXXXX (no +233)</p>
                    {errors.phone && (
                      <p className="mt-1 text-sm text-red-400">{errors.phone.message}</p>
                    )}
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="submit"
                      disabled={updateMutation.isPending}
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 min-h-[48px] bg-gradient-to-r from-brand-gold to-amber-600 text-brand-maroon-black rounded-xl hover:from-brand-gold/90 hover:to-amber-500 font-semibold disabled:opacity-50 disabled:cursor-not-allowed touch-manipulation"
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
                      className="flex-1 flex items-center justify-center gap-2 px-4 py-2 min-h-[48px] border border-white/30 text-white/90 rounded-xl hover:bg-white/10 disabled:opacity-50 touch-manipulation"
                    >
                      <X className="w-4 h-4" />
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-start gap-4">
                    <Phone className="w-5 h-5 text-brand-gold mt-1 shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-white/60">Phone</p>
                      <p className="font-medium text-white">{displayUser?.phone || 'Not set'}</p>
                      {!displayUser?.phone && (
                        <p className="text-xs text-amber-400 mt-1">Add your phone to use escrows and payments</p>
                      )}
                    </div>
                  </div>

                  {displayUser?.email && (
                    <div className="flex items-start gap-4">
                      <Mail className="w-5 h-5 text-brand-gold mt-1 shrink-0" />
                      <div className="flex-1">
                        <p className="text-sm text-white/60">Email</p>
                        <p className="font-medium text-white">{displayUser.email}</p>
                      </div>
                    </div>
                  )}

                  <div className="flex items-start gap-4">
                    <User className="w-5 h-5 text-brand-gold mt-1 shrink-0" />
                    <div className="flex-1">
                      <p className="text-sm text-white/60">Name</p>
                      {displayUser?.firstName || displayUser?.lastName ? (
                        <p className="font-medium text-white">
                          {displayUser.firstName || ''} {displayUser.lastName || ''}
                        </p>
                      ) : (
                        <p className="text-white/50 italic">Not set - Click Edit to add your name</p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <Calendar className="w-5 h-5 text-brand-gold mt-1 shrink-0" />
                    <div>
                      <p className="text-sm text-white/60">Member Since</p>
                      <p className="font-medium text-white">
                        {profile?.createdAt ? formatDate(profile.createdAt) : 'N/A'}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <Shield className="w-5 h-5 text-brand-gold mt-1 shrink-0" />
                    <div>
                      <p className="text-sm text-white/60">Roles</p>
                      <div className="flex gap-2 mt-1">
                        {displayUser?.roles?.map((role: string) => (
                          <span
                            key={role}
                            className="px-2 py-1 bg-brand-gold/20 text-brand-gold text-xs font-medium rounded"
                          >
                            {role}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>

                </div>
              )}

              {!isEditing && (
                <div className="mt-8 pt-6 border-t border-white/10">
                  <h3 className="text-lg font-semibold text-white mb-4">Security</h3>
                  <Link
                    href="/change-password"
                    className="flex items-center gap-3 p-4 bg-white/5 hover:bg-white/10 rounded-xl transition border border-white/10 touch-manipulation"
                  >
                    <Key className="w-5 h-5 text-brand-gold shrink-0" />
                    <div className="flex-1">
                      <p className="font-medium text-white">Change Password</p>
                      <p className="text-sm text-white/70">Update your account password</p>
                    </div>
                    <span className="text-brand-gold">→</span>
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
