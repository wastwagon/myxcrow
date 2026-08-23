import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import CustomerLayout from '@/components/CustomerLayout';
import { getUser, setUser, logout, isAdmin } from '@/lib/auth';
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
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { ListRowsSkeleton, PageSpinner } from '@/components/LoadingSkeleton';
import { useIsMobileNav } from '@/lib/hooks/useMediaQuery';
import { useRequireAuth } from '@/lib/hooks/useRequireAuth';
import { CustomerShellChrome, SHELL_CONTENT_CLASS } from '@/components/home/CustomerShellChrome';
import { AccountProfileCard } from '@/components/account/AccountProfileCard';
import { WalletMenuGrid, type WalletMenuTile } from '@/components/wallet/WalletMenuGrid';
import {
  AlertCircle,
  CircleHelp,
  KeyRound,
  LayoutDashboard,
  LogOut,
  MessageCircle,
  Trash2,
} from 'lucide-react';

interface ProfileData {
  firstName?: string;
  lastName?: string;
  email?: string;
  phone?: string;
  roles?: string[];
  createdAt?: string;
}

function buildAccountMenuTiles({
  admin,
  onSignOut,
}: {
  admin: boolean;
  onSignOut: () => void;
}): WalletMenuTile[] {
  const tiles: WalletMenuTile[] = [
    {
      href: '/change-password',
      label: 'Password',
      subtitle: 'Security',
      icon: KeyRound,
      color: 'gray',
    },
    {
      href: '/disputes',
      label: 'Disputes',
      subtitle: 'Your cases',
      icon: AlertCircle,
      color: 'orange',
    },
    {
      href: '/messages',
      label: 'Messages',
      subtitle: 'Deals & support',
      icon: MessageCircle,
      color: 'indigo',
    },
    {
      href: '/help',
      label: 'Help',
      subtitle: 'Get support',
      icon: CircleHelp,
      color: 'teal',
    },
  ];

  if (admin) {
    tiles.push({
      href: '/admin',
      label: 'Admin',
      subtitle: 'Dashboard',
      icon: LayoutDashboard,
      color: 'indigo',
    });
  }

  tiles.push({
    onClick: onSignOut,
    label: 'Sign out',
    subtitle: 'This device',
    icon: LogOut,
    color: 'maroon',
  });

  return tiles;
}

export default function ProfilePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isMobile = useIsMobileNav();
  const confirm = useConfirm();
  const authed = useRequireAuth();
  const user = getUser();
  const [isEditing, setIsEditing] = useState(false);
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletePassword, setDeletePassword] = useState('');
  const [deleteError, setDeleteError] = useState('');

  useEffect(() => {
    if (!authed) return;
    if (new URLSearchParams(window.location.search).get('phone_required') === '1') {
      setIsEditing(true);
    }
  }, [authed]);

  const { data: profile, isLoading } = useQuery<ProfileData>({
    queryKey: ['profile'],
    queryFn: async () => {
      const response = await apiClient.get('/auth/profile');
      return response.data;
    },
    enabled: authed,
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

  if (!authed) {
    return <PageSpinner />;
  }

  const displayUser = profile || user;
  const phoneRequired = router.query.phone_required === '1';
  const displayName =
    [displayUser?.firstName, displayUser?.lastName].filter(Boolean).join(' ') ||
    displayUser?.phone ||
    displayUser?.email ||
    'Your account';

  const refreshProfile = async () => {
    await queryClient.invalidateQueries({ queryKey: ['profile'] });
  };

  const handleSignOut = async () => {
    const ok = await confirm({
      title: 'Sign out',
      message: 'Sign out of this account?',
      confirmLabel: 'Sign out',
    });
    if (!ok) return;
    await logout();
    queryClient.clear();
    router.push('/login');
  };

  const editTrailing = isEditing ? (
    <button
      type="submit"
      form="account-edit"
      disabled={updateMutation.isPending}
      className="min-h-[44px] px-3 text-[17px] font-semibold text-brand-gold touch-manipulation disabled:opacity-50"
    >
      {updateMutation.isPending ? 'Saving' : 'Done'}
    </button>
  ) : (
    <button
      type="button"
      onClick={() => setIsEditing(true)}
      className="min-h-[44px] px-3 text-[17px] font-semibold text-brand-gold touch-manipulation"
    >
      Edit
    </button>
  );

  return (
    <CustomerLayout title="Account" variant="home">
      <PullToRefresh onRefresh={refreshProfile} disabled={!isMobile}>
        <CustomerShellChrome
          screenTitle="Account"
          pageTitle={isEditing ? 'Edit account' : undefined}
          leading={isEditing ? 'back' : 'close'}
          closeHref="/dashboard"
          onLeadingClick={isEditing ? handleCancel : undefined}
          trailing={editTrailing}
        />
        <div className={`${SHELL_CONTENT_CLASS} space-y-6`}>
        {phoneRequired && !displayUser?.phone && (
          <p className="text-[13px] text-[rgba(60,60,67,0.6)] px-1">
            Add a Ghana phone number to use escrows and payments. Verification is by SMS code when you register.
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
          <div className="space-y-5">
            <AccountProfileCard
              name={displayName}
              phone={displayUser?.phone}
              email={displayUser?.email}
              avatarLabel={displayUser?.firstName || displayUser?.phone || displayUser?.email || 'User'}
              loading={isLoading}
            />

            <div className="space-y-2.5">
              <p className="px-1 text-[13px] text-[rgba(60,60,67,0.6)]">Account</p>
              <WalletMenuGrid
                tiles={buildAccountMenuTiles({
                  admin: isAdmin(),
                  onSignOut: handleSignOut,
                })}
              />
            </div>

            <button
              type="button"
              onClick={() => setDeleteModalOpen(true)}
              className="flex w-full min-h-[52px] items-center justify-center gap-2 rounded-[16px] border border-red-200/80 bg-white px-4 text-[15px] font-semibold text-red-600 touch-manipulation active:bg-red-50"
            >
              <Trash2 className="h-4 w-4" strokeWidth={2} aria-hidden />
              Delete account
            </button>
            <p className="px-1 text-center text-[12px] text-[rgba(60,60,67,0.5)]">
              This permanently removes your account.
            </p>
          </div>
        )}
        </div>
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
