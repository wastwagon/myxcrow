import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Link from 'next/link';
import Layout from '@/components/Layout';
import { isAuthenticated, getUser, setUser, clearAuth, isAdmin } from '@/lib/auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { getErrorMessage } from '@/lib/error-messages';
import {
  User,
  Mail,
  Phone,
  Calendar,
  Shield,
  Edit2,
  Save,
  X,
  Key,
  Trash2,
  AlertTriangle,
  LayoutDashboard,
  LogOut,
  HelpCircle,
  ShieldCheck,
} from 'lucide-react';
import { formatDate } from '@/lib/utils';
import { toast } from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { ListGroup, ListRow } from '@/components/ui/ListGroup';
import { Button } from '@/components/ui/Button';
import { Sheet } from '@/components/ui/Sheet';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { ListRowsSkeleton } from '@/components/LoadingSkeleton';
import { useIsMobileNav } from '@/lib/hooks/useMediaQuery';

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
  const isMobile = useIsMobileNav();
  const user = getUser();
  const [isEditing, setIsEditing] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      new URLSearchParams(window.location.search).get('phone_required') === '1'
    ) {
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

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<{
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

  useEffect(() => {
    if (profile) {
      reset({
        firstName: profile.firstName || '',
        lastName: profile.lastName || '',
        phone: profile.phone || '',
      });
    }
  }, [profile, reset]);

  const deleteAccountMutation = useMutation({
    mutationFn: async (password: string) => {
      await apiClient.delete('/auth/account', { data: { password } });
    },
    onSuccess: () => {
      clearAuth();
      queryClient.clear();
      toast.success('Your account has been deleted');
      router.push('/');
    },
    onError: (error: any) => {
      setDeleteError(getErrorMessage(error, 'Failed to delete account'));
    },
  });

  const updateMutation = useMutation({
    mutationFn: async (data: { firstName?: string; lastName?: string; phone?: string }) => {
      const response = await apiClient.put('/auth/profile', data);
      return response.data;
    },
    onSuccess: (data) => {
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

  const handleDeleteAccount = () => {
    if (!deletePassword.trim()) {
      setDeleteError('Enter your password to confirm');
      return;
    }
    setDeleteError('');
    deleteAccountMutation.mutate(deletePassword.trim());
  };

  const closeDeleteModal = () => {
    setDeleteModalOpen(false);
    setDeletePassword('');
    setDeleteError('');
  };

  if (!isAuthenticated()) {
    return null;
  }

  const displayUser = profile || user;
  const phoneRequired =
    typeof window !== 'undefined' &&
    new URLSearchParams(window.location.search).get('phone_required') === '1';
  const displayName =
    [displayUser?.firstName, displayUser?.lastName].filter(Boolean).join(' ') ||
    displayUser?.phone ||
    displayUser?.email ||
    'Your account';
  const kycVerified = displayUser?.kycStatus === 'VERIFIED';

  const refreshProfile = async () => {
    await queryClient.invalidateQueries({ queryKey: ['profile'] });
  };

  return (
    <Layout>
      {phoneRequired && !displayUser?.phone && (
        <div className="mb-4 rounded-ios-xl border border-amber-500/40 bg-amber-500/20 p-4 text-amber-200">
          <p className="font-medium">Phone number required</p>
          <p className="mt-1 text-sm opacity-90">
            Add your Ghana phone number below to use escrows, payments, and other features.
          </p>
        </div>
      )}

      <PullToRefresh
        onRefresh={refreshProfile}
        disabled={!isMobile}
        className="mx-auto max-w-2xl space-y-6"
      >
        <header className="flex items-end justify-between gap-3 px-1">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-brand-gold/80">
              Account
            </p>
            <h1 className="mt-1 text-2xl md:text-3xl font-bold tracking-tight text-white">Profile</h1>
            <p className="mt-1 text-sm text-white/55">Manage your account information</p>
          </div>
          {!isEditing && (
            <Button variant="tinted" size="sm" onClick={() => setIsEditing(true)}>
              <Edit2 className="w-4 h-4" />
              Edit
            </Button>
          )}
        </header>

        <section className="overflow-hidden rounded-ios-xl border border-white/10 bg-white/[0.07] backdrop-blur-sm">
          {isLoading ? (
            <div className="p-6">
              <ListRowsSkeleton rows={3} rowClassName="h-16" />
            </div>
          ) : (
            <>
              <div className="flex items-center gap-4 border-b border-white/10 p-5 md:p-6">
                <UserAvatar
                  label={displayUser?.firstName || displayUser?.phone || displayUser?.email || 'User'}
                  size="lg"
                />
                <div className="min-w-0 flex-1">
                  <h2 className="truncate text-xl font-semibold text-white">{displayName}</h2>
                  <p className="mt-0.5 truncate text-sm text-white/55">
                    {displayUser?.phone || displayUser?.email || 'Complete your profile'}
                  </p>
                  <div className="mt-2.5">
                    {kycVerified ? (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-emerald-400/25 bg-emerald-400/10 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
                        <ShieldCheck className="h-3.5 w-3.5" />
                        Identity verified
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 rounded-full border border-amber-400/25 bg-amber-400/10 px-2.5 py-1 text-[11px] font-semibold text-amber-200">
                        <Shield className="h-3.5 w-3.5" />
                        Keep profile details current
                      </span>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-5 md:p-6">
                {isEditing ? (
                  <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                    <div>
                      <label htmlFor="firstName" className="mb-1.5 block text-sm font-medium text-white/70">
                        First name
                      </label>
                      <input
                        {...register('firstName')}
                        type="text"
                        id="firstName"
                        className="w-full min-h-[48px] rounded-ios-lg border border-white/15 bg-black/20 px-4 py-2.5 text-white placeholder-white/45 focus:border-brand-gold/50 focus:ring-2 focus:ring-brand-gold"
                        placeholder="Enter your first name"
                      />
                      {errors.firstName && (
                        <p className="mt-1 text-sm text-red-400">{errors.firstName.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="lastName" className="mb-1.5 block text-sm font-medium text-white/70">
                        Last name
                      </label>
                      <input
                        {...register('lastName')}
                        type="text"
                        id="lastName"
                        className="w-full min-h-[48px] rounded-ios-lg border border-white/15 bg-black/20 px-4 py-2.5 text-white placeholder-white/45 focus:border-brand-gold/50 focus:ring-2 focus:ring-brand-gold"
                        placeholder="Enter your last name"
                      />
                      {errors.lastName && (
                        <p className="mt-1 text-sm text-red-400">{errors.lastName.message}</p>
                      )}
                    </div>

                    <div>
                      <label htmlFor="phone" className="mb-1.5 block text-sm font-medium text-white/70">
                        Phone number (Ghana) *
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
                        className="w-full min-h-[48px] rounded-ios-lg border border-white/15 bg-black/20 px-4 py-2.5 text-white placeholder-white/45 focus:border-brand-gold/50 focus:ring-2 focus:ring-brand-gold"
                        placeholder="0551234567"
                      />
                      <p className="mt-1 text-xs text-white/45">Format: 0XXXXXXXXX (no +233)</p>
                      {errors.phone && (
                        <p className="mt-1 text-sm text-red-400">{errors.phone.message}</p>
                      )}
                    </div>

                    <div className="flex gap-3 pt-2">
                      <Button
                        type="submit"
                        variant="filled"
                        size="lg"
                        fullWidth
                        loading={updateMutation.isPending}
                      >
                        <Save className="w-4 h-4" />
                        Save changes
                      </Button>
                      <Button
                        type="button"
                        variant="secondary"
                        size="lg"
                        fullWidth
                        onClick={handleCancel}
                        disabled={updateMutation.isPending}
                      >
                        <X className="w-4 h-4" />
                        Cancel
                      </Button>
                    </div>
                  </form>
                ) : (
                  <div className="space-y-1">
                    {[
                      {
                        icon: Phone,
                        label: 'Phone',
                        value: displayUser?.phone || 'Not set',
                        hint: !displayUser?.phone
                          ? 'Add your phone to use escrows and payments'
                          : undefined,
                      },
                      displayUser?.email
                        ? { icon: Mail, label: 'Email', value: displayUser.email }
                        : null,
                      {
                        icon: User,
                        label: 'Name',
                        value:
                          displayUser?.firstName || displayUser?.lastName
                            ? `${displayUser.firstName || ''} ${displayUser.lastName || ''}`.trim()
                            : 'Not set',
                        muted: !(displayUser?.firstName || displayUser?.lastName),
                      },
                      {
                        icon: Calendar,
                        label: 'Member since',
                        value: profile?.createdAt ? formatDate(profile.createdAt) : 'N/A',
                      },
                    ]
                      .filter(Boolean)
                      .map((row: any) => {
                        const Icon = row.icon;
                        return (
                          <div
                            key={row.label}
                            className="flex items-start gap-3 rounded-ios-lg px-2 py-3"
                          >
                            <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-gold/10 text-brand-gold">
                              <Icon className="h-4 w-4" />
                            </span>
                            <div className="min-w-0 flex-1">
                              <p className="text-xs font-medium text-white/45">{row.label}</p>
                              <p
                                className={`mt-0.5 font-medium ${
                                  row.muted ? 'italic text-white/45' : 'text-white'
                                }`}
                              >
                                {row.value}
                              </p>
                              {row.hint && (
                                <p className="mt-1 text-xs text-amber-400">{row.hint}</p>
                              )}
                            </div>
                          </div>
                        );
                      })}

                    <div className="flex items-start gap-3 rounded-ios-lg px-2 py-3">
                      <span className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-brand-gold/10 text-brand-gold">
                        <Shield className="h-4 w-4" />
                      </span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-medium text-white/45">Roles</p>
                        <div className="mt-1.5 flex flex-wrap gap-2">
                          {displayUser?.roles?.map((role: string) => (
                            <span
                              key={role}
                              className="rounded-full bg-brand-gold/15 px-2.5 py-1 text-[11px] font-semibold text-brand-gold"
                            >
                              {role}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </>
          )}
        </section>

        {!isEditing && !isLoading && (
          <div className="space-y-6">
            <ListGroup title="Account">
              {isAdmin() && (
                <ListRow
                  href="/admin"
                  leading={<LayoutDashboard className="w-5 h-5 text-brand-gold" />}
                  title="Admin dashboard"
                  subtitle="Manage users, withdrawals, settings"
                />
              )}
              <ListRow
                href="/change-password"
                leading={<Key className="w-5 h-5 text-brand-gold" />}
                title="Change password"
                subtitle="Update your account password"
              />
              <ListRow
                href="/support"
                leading={<HelpCircle className="w-5 h-5 text-brand-gold" />}
                title="Support"
                subtitle="Get help with your account"
              />
              <ListRow
                onClick={() => {
                  clearAuth();
                  queryClient.clear();
                  router.push('/login');
                }}
                leading={<LogOut className="w-5 h-5 text-label-secondary" />}
                title="Sign out"
                showChevron={false}
              />
            </ListGroup>

            <ListGroup title="Danger zone" footer="This action is permanent.">
              <ListRow
                onClick={() => setDeleteModalOpen(true)}
                leading={<Trash2 className="w-5 h-5 text-ios-destructive" />}
                title="Delete account"
                subtitle="Permanently remove your data"
                destructive
                showChevron={false}
              />
            </ListGroup>
          </div>
        )}
      </PullToRefresh>

      <Sheet
        open={deleteModalOpen}
        onClose={closeDeleteModal}
        title="Delete account"
        footer={
          <div className="flex flex-col gap-2 pb-2">
            <Button
              fullWidth
              variant="destructive"
              onClick={handleDeleteAccount}
              loading={deleteAccountMutation.isPending}
              disabled={!deletePassword.trim()}
            >
              Delete my account
            </Button>
            <Button fullWidth variant="plain" onClick={closeDeleteModal}>
              Cancel
            </Button>
          </div>
        }
      >
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-red-500/20">
            <AlertTriangle className="h-5 w-5 text-red-400" />
          </div>
          <p className="text-ios-subhead text-label-secondary">
            This permanently deletes your account and anonymizes your data.
          </p>
        </div>
        <label htmlFor="delete-password" className="mb-2 block text-ios-footnote text-label-secondary">
          Enter your password to confirm
        </label>
        <input
          id="delete-password"
          type="password"
          value={deletePassword}
          onChange={(e) => setDeletePassword(e.target.value)}
          placeholder="Your password"
          className="w-full min-h-[48px] rounded-ios-lg border border-white/20 bg-white/5 px-4 py-3 text-label-primary placeholder:text-label-tertiary outline-none focus:ring-2 focus:ring-red-500/50"
          autoComplete="current-password"
        />
        {deleteError && <p className="mt-3 text-ios-footnote text-red-400">{deleteError}</p>}
      </Sheet>
    </Layout>
  );
}
