import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import CustomerLayout from '@/components/CustomerLayout';
import { isAuthenticated, getUser, setUser, clearAuth, isAdmin } from '@/lib/auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { getErrorMessage } from '@/lib/error-messages';
import { toast } from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { ListGroup, ListRow } from '@/components/ui/ListGroup';
import { Button } from '@/components/ui/Button';
import { form } from '@/lib/form-classes';
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
    <CustomerLayout
      title="Account"
      trailing={
        !isEditing ? (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="min-h-[44px] px-3 text-[17px] font-semibold text-brand-maroon touch-manipulation"
          >
            Edit
          </button>
        ) : undefined
      }
    >
      <PullToRefresh onRefresh={refreshProfile} disabled={!isMobile} className="space-y-6 pb-4">
        {phoneRequired && !displayUser?.phone && (
          <p className="text-[13px] text-[rgba(60,60,67,0.6)] px-1">
            Add a Ghana phone number to use escrows and payments.
          </p>
        )}

        {isLoading ? (
          <ListRowsSkeleton rows={4} />
        ) : isEditing ? (
          <form onSubmit={handleSubmit(onSubmit)} className={`${form.panel} space-y-4`}>
            <div>
              <label htmlFor="firstName" className={form.label}>
                First name
              </label>
              <input {...register('firstName')} type="text" id="firstName" className={form.input} />
              {errors.firstName && <p className={form.inputError}>{errors.firstName.message}</p>}
            </div>
            <div>
              <label htmlFor="lastName" className={form.label}>
                Last name
              </label>
              <input {...register('lastName')} type="text" id="lastName" className={form.input} />
              {errors.lastName && <p className={form.inputError}>{errors.lastName.message}</p>}
            </div>
            <div>
              <label htmlFor="phone" className={form.label}>
                Phone
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
                className={form.input}
                placeholder="0551234567"
              />
              {errors.phone && <p className={form.inputError}>{errors.phone.message}</p>}
            </div>
            <Button type="submit" variant="maroon" size="lg" fullWidth loading={updateMutation.isPending}>
              Save
            </Button>
            <Button
              type="button"
              variant="outline"
              size="lg"
              fullWidth
              onClick={handleCancel}
              disabled={updateMutation.isPending}
            >
              Cancel
            </Button>
          </form>
        ) : (
          <>
            <ListGroup tone="light" title="Profile">
              <ListRow
                title={displayName}
                subtitle={displayUser?.phone || displayUser?.email || 'Add your details'}
                leading={
                  <UserAvatar
                    label={displayUser?.firstName || displayUser?.phone || displayUser?.email || 'User'}
                    size="md"
                  />
                }
                showChevron={false}
              />
              <ListRow
                title="Phone"
                trailing={
                  <span className="text-[17px] text-[rgba(60,60,67,0.6)]">
                    {displayUser?.phone || 'Not set'}
                  </span>
                }
                showChevron={false}
              />
              {displayUser?.email && (
                <ListRow
                  title="Email"
                  trailing={
                    <span className="max-w-[180px] truncate text-[17px] text-[rgba(60,60,67,0.6)]">
                      {displayUser.email}
                    </span>
                  }
                  showChevron={false}
                />
              )}
              <ListRow
                title="Identity"
                trailing={
                  <span className="text-[17px] text-[rgba(60,60,67,0.6)]">
                    {kycVerified ? 'Verified' : 'Unverified'}
                  </span>
                }
                showChevron={false}
              />
            </ListGroup>

            <ListGroup tone="light" title="Account">
              {isAdmin() && <ListRow href="/admin" title="Admin" />}
              <ListRow href="/change-password" title="Password" />
              <ListRow href="/support" title="Help" />
              <ListRow
                onClick={() => {
                  clearAuth();
                  queryClient.clear();
                  router.push('/login');
                }}
                title="Sign out"
                showChevron={false}
              />
            </ListGroup>

            <ListGroup tone="light" footer="This permanently removes your account.">
              <ListRow
                onClick={() => setDeleteModalOpen(true)}
                title="Delete account"
                destructive
                showChevron={false}
              />
            </ListGroup>
          </>
        )}
      </PullToRefresh>

      <Sheet
        open={deleteModalOpen}
        onClose={closeDeleteModal}
        title="Delete account"
        tone="light"
        footer={
          <div className="flex flex-col gap-2 pb-2">
            <Button
              fullWidth
              variant="destructive"
              onClick={handleDeleteAccount}
              loading={deleteAccountMutation.isPending}
              disabled={!deletePassword.trim()}
            >
              Delete account
            </Button>
            <Button fullWidth variant="outline" onClick={closeDeleteModal}>
              Cancel
            </Button>
          </div>
        }
      >
        <p className="mb-4 text-[15px] text-[rgba(60,60,67,0.6)]">
          This permanently deletes your account and anonymizes your data.
        </p>
        <label htmlFor="delete-password" className={form.label}>
          Password
        </label>
        <input
          id="delete-password"
          type="password"
          value={deletePassword}
          onChange={(e) => setDeletePassword(e.target.value)}
          placeholder="Your password"
          className={form.input}
          autoComplete="current-password"
        />
        {deleteError && <p className="mt-3 text-[13px] text-red-600">{deleteError}</p>}
      </Sheet>
    </CustomerLayout>
  );
}
