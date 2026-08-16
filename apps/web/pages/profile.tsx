import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import CustomerLayout from '@/components/CustomerLayout';
import { isAuthenticated, getUser, setUser, logout, isAdmin } from '@/lib/auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { getErrorMessage } from '@/lib/error-messages';
import { toast } from 'react-hot-toast';
import { useForm } from 'react-hook-form';
import { ListGroup, ListRow } from '@/components/ui/ListGroup';
import { Button } from '@/components/ui/Button';
import { useConfirm } from '@/components/providers/UIProvider';
import { Input } from '@/components/ui/Input';
import { Field } from '@/components/ui/Field';
import { Sheet } from '@/components/ui/Sheet';
import { UserAvatar } from '@/components/ui/UserAvatar';
import { IconWell } from '@/components/ui/IconWell';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { ListRowsSkeleton } from '@/components/LoadingSkeleton';
import { useIsMobileNav } from '@/lib/hooks/useMediaQuery';
import { CircleHelp, KeyRound, LayoutDashboard } from 'lucide-react';

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
  const confirm = useConfirm();
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
    onSuccess: async () => {
      await logout();
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
      back={isEditing}
      onBack={isEditing ? handleCancel : undefined}
      trailing={
        isEditing ? (
          <button
            type="submit"
            form="account-edit"
            disabled={updateMutation.isPending}
            className="min-h-[44px] px-3 text-[17px] font-semibold text-brand-maroon touch-manipulation disabled:opacity-50"
          >
            {updateMutation.isPending ? 'Saving' : 'Done'}
          </button>
        ) : (
          <button
            type="button"
            onClick={() => setIsEditing(true)}
            className="min-h-[44px] px-3 text-[17px] font-semibold text-brand-maroon touch-manipulation"
          >
            Edit
          </button>
        )
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
          <form id="account-edit" onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <ListGroup title="Name">
              <label className="flex items-center min-h-[44px] px-4 gap-3 relative after:absolute after:right-0 after:bottom-0 after:h-px after:bg-[rgba(60,60,67,0.12)] after:left-4">
                <span className="w-[92px] shrink-0 text-[17px] text-gray-900">First</span>
                <input
                  {...register('firstName')}
                  type="text"
                  id="firstName"
                  className="flex-1 min-h-[44px] py-2 text-[17px] bg-transparent outline-none text-gray-900 placeholder:text-[rgba(60,60,67,0.4)]"
                  autoComplete="given-name"
                />
              </label>
              <label className="flex items-center min-h-[44px] px-4 gap-3">
                <span className="w-[92px] shrink-0 text-[17px] text-gray-900">Last</span>
                <input
                  {...register('lastName')}
                  type="text"
                  id="lastName"
                  className="flex-1 min-h-[44px] py-2 text-[17px] bg-transparent outline-none text-gray-900 placeholder:text-[rgba(60,60,67,0.4)]"
                  autoComplete="family-name"
                />
              </label>
            </ListGroup>
            <ListGroup title="Phone" footer="Ghana numbers start with 0, ten digits.">
              <label className="flex items-center min-h-[44px] px-4 gap-3">
                <span className="w-[92px] shrink-0 text-[17px] text-gray-900">Mobile</span>
                <input
                  {...register('phone', {
                    pattern: {
                      value: /^0[0-9]{9}$/,
                      message: 'Enter Ghana phone (e.g. 0551234567)',
                    },
                  })}
                  type="tel"
                  id="phone"
                  className="flex-1 min-h-[44px] py-2 text-[17px] bg-transparent outline-none text-gray-900 placeholder:text-[rgba(60,60,67,0.4)]"
                  placeholder="0551234567"
                  autoComplete="tel"
                />
              </label>
            </ListGroup>
            {(errors.firstName || errors.lastName || errors.phone) && (
              <p className="px-4 text-[13px] text-red-600">
                {errors.phone?.message || errors.firstName?.message || errors.lastName?.message}
              </p>
            )}
          </form>
        ) : (
          <>
            <ListGroup title="Profile">
              <ListRow
                title={displayName}
                subtitle={displayUser?.phone || displayUser?.email || 'Add your details'}
                leading={
                  <UserAvatar
                    label={displayUser?.firstName || displayUser?.phone || displayUser?.email || 'User'}
                    size="md"
                    variant="maroon"
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

            <ListGroup title="Account">
              {isAdmin() && (
                <ListRow
                  href="/admin"
                  title="Admin"
                  leading={<IconWell icon={LayoutDashboard} color="orange" />}
                />
              )}
              <ListRow
                href="/change-password"
                title="Password"
                leading={<IconWell icon={KeyRound} color="gray" />}
              />
              <ListRow
                href="/support"
                title="Help"
                leading={<IconWell icon={CircleHelp} color="teal" />}
              />
              <ListRow
                onClick={async () => {
                  const ok = await confirm({
                    title: 'Sign out',
                    message: 'Sign out of this account?',
                    confirmLabel: 'Sign out',
                  });
                  if (!ok) return;
                  await logout();
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
        <Field tone="light" label="Password" htmlFor="delete-password">
          <Input
            id="delete-password"
            tone="light"
            type="password"
            value={deletePassword}
            onChange={(e) => setDeletePassword(e.target.value)}
            placeholder="Your password"
            autoComplete="current-password"
          />
        </Field>
        {deleteError && <p className="mt-3 text-[13px] text-red-600">{deleteError}</p>}
      </Sheet>
    </CustomerLayout>
  );
}
