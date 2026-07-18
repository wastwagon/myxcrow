import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { isAuthenticated, isAdmin } from '@/lib/auth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Loader2, Search, User, Wallet, X, AlertTriangle } from 'lucide-react';
import { CURRENCY_SYMBOL } from '@/lib/constants';
import { toast } from 'react-hot-toast';
import { AdminAvatar } from '@/components/admin/AdminIconBadge';
import { Button } from '@/components/ui/Button';
import { admin } from '@/components/admin/adminClasses';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { useIsMobileNav } from '@/lib/hooks/useMediaQuery';
import PageHeader from '@/components/PageHeader';

const debitSchema = z.object({
  userId: z.string().min(1, 'User is required'),
  amountCents: z.number().min(0.01, 'Amount must be greater than 0'),
  description: z.string().min(1, 'Description is required for debit operations'),
});

type DebitFormData = z.infer<typeof debitSchema>;

interface UserOption {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

export default function DebitWalletPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isMobile = useIsMobileNav();
  const userIdFromQuery = typeof router.query.userId === 'string' ? router.query.userId : undefined;
  const [searchTerm, setSearchTerm] = useState('');
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);

  useEffect(() => {
    if (!isAuthenticated() || !isAdmin()) {
      router.push('/login');
    }
  }, [router]);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<DebitFormData>({
    resolver: zodResolver(debitSchema),
    defaultValues: { userId: userIdFromQuery || '' },
  });

  // Fetch user when userId is in query (e.g. from admin users page)
  const { data: userData } = useQuery({
    queryKey: ['user', userIdFromQuery],
    queryFn: async () => {
      const r = await apiClient.get(`/users/${userIdFromQuery}`);
      return r.data;
    },
    enabled: !!userIdFromQuery && isAuthenticated() && isAdmin(),
  });

  useEffect(() => {
    if (userData && userIdFromQuery) {
      setSelectedUser({
        id: userData.id,
        email: userData.email,
        firstName: userData.firstName,
        lastName: userData.lastName,
      });
      setValue('userId', userData.id);
    }
  }, [userData, userIdFromQuery, setValue]);

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['users', searchTerm],
    queryFn: async () => {
      const response = await apiClient.get(`/users?search=${encodeURIComponent(searchTerm)}&limit=10`);
      return response.data;
    },
    enabled: showUserSearch && searchTerm.length > 0,
  });

  const amountGHS = watch('amountCents');

  const debitMutation = useMutation({
    mutationFn: async (data: DebitFormData) => {
      return apiClient.post('/wallet/admin/debit', {
        userId: data.userId,
        amountCents: Math.round(data.amountCents * 100),
        description: data.description,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Wallet debited successfully');
      router.push('/admin');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to debit wallet');
    },
  });

  const onSubmit = (data: DebitFormData) => {
    debitMutation.mutate(data);
  };

  const handleUserSelect = (user: UserOption) => {
    setSelectedUser(user);
    setValue('userId', user.id);
    setShowUserSearch(false);
    setSearchTerm('');
  };

  if (!isAuthenticated() || !isAdmin()) {
    return null;
  }

  const refreshDebitPage = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['users'] }),
      queryClient.invalidateQueries({ queryKey: ['wallet'] }),
    ]);
  };

  return (
    <Layout>
      <PullToRefresh onRefresh={refreshDebitPage} disabled={!isMobile} className="max-w-3xl mx-auto space-y-6">
        <PageHeader
          eyebrow="Admin"
          title="Debit Wallet"
          subtitle="Manually debit a user's wallet"
          icon={<Wallet className="w-6 h-6" />}
        />

        <div className={`${admin.calloutWarning}`}>
          <AlertTriangle className="w-5 h-5 text-amber-400 flex-shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-200">Warning</p>
            <p className="text-sm text-amber-100/90">
              This will deduct funds from the user&apos;s wallet. Make sure you have a valid reason and provide a detailed description for audit purposes.
            </p>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="rounded-ios-xl border border-white/10 bg-white/[0.07] backdrop-blur-sm shadow-ios-card p-8 space-y-6">
          {/* User Selection */}
          <div className="relative">
            <label htmlFor="user" className="block text-sm font-semibold text-white/80 mb-2">
              Select User *
            </label>
            {selectedUser ? (
              <div className={admin.selectedUserCardDanger}>
                <div className="flex items-center gap-3">
                  <AdminAvatar label={selectedUser.email} variant="destructive" />
                  <div>
                    <p className="font-medium text-white">{selectedUser.email}</p>
                    <p className="text-sm text-white/55">User ID: {selectedUser.id.slice(0, 8)}...</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedUser(null);
                    setValue('userId', '');
                  }}
                  className="text-white/50 hover:text-white/70"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-white/50" />
                </div>
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setShowUserSearch(true);
                  }}
                  onFocus={() => setShowUserSearch(true)}
                  placeholder="Search by email or name..."
                  className={`${admin.input} pl-10`}
                />
                {showUserSearch && searchTerm && (
                  <div className={admin.searchDropdown}>
                    {usersLoading ? (
                      <div className="p-4 text-center">
                        <Loader2 className="w-5 h-5 animate-spin mx-auto text-white/50" />
                      </div>
                    ) : usersData?.users?.length > 0 ? (
                      usersData.users.map((user: UserOption) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => handleUserSelect(user)}
                          className={admin.searchDropdownItem}
                        >
                          <AdminAvatar label={user.email} variant="destructive" className="w-8 h-8 text-xs" />
                          <div className="flex-1">
                            <p className="font-medium text-white">{user.email}</p>
                            <p className="text-sm text-white/55">ID: {user.id.slice(0, 8)}...</p>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="p-4 text-center text-white/55">No users found</div>
                    )}
                  </div>
                )}
              </div>
            )}
            <input type="hidden" {...register('userId')} />
            {errors.userId && (
              <p className="mt-1 text-sm text-red-400">{errors.userId.message}</p>
            )}
          </div>

          {/* Amount */}
          <div>
            <label htmlFor="amountCents" className="block text-sm font-semibold text-white/80 mb-2">
              Amount ({CURRENCY_SYMBOL}) *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-white/55 font-medium">{CURRENCY_SYMBOL}</span>
              <input
                {...register('amountCents', { valueAsNumber: true })}
                type="number"
                id="amountCents"
                step="0.01"
                min="0.01"
                placeholder="50.00"
                className={`${admin.input} pl-16 text-lg font-semibold`}
              />
            </div>
            {amountGHS && (
              <p className="mt-2 text-sm text-white/55">
                Will debit: <span className="font-medium text-white">{Math.round(amountGHS * 100).toLocaleString()}</span> cents
              </p>
            )}
            {errors.amountCents && (
              <p className="mt-1 text-sm text-red-400">{errors.amountCents.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-white/80 mb-2">
              Description * <span className="text-red-400">(Required for audit)</span>
            </label>
            <textarea
              {...register('description')}
              id="description"
              rows={4}
              placeholder="e.g., Refund for cancelled order #12345 - Customer requested full refund"
              className={admin.input}
            />
            <p className="mt-1 text-xs text-white/55">Please provide a detailed reason for this debit operation</p>
            {errors.description && (
              <p className="mt-1 text-sm text-red-400">{errors.description.message}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <Button type="button" variant="secondary" size="lg" fullWidth onClick={() => router.back()}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              size="lg"
              fullWidth
              disabled={!selectedUser}
              loading={debitMutation.isPending}
            >
              <User className="w-5 h-5" />
              Debit Wallet
            </Button>
          </div>
        </form>
      </PullToRefresh>
    </Layout>
  );
}
