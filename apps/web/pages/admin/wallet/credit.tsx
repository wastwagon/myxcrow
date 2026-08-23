import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import { AdminGate } from '@/components/admin/AdminGate';
import { isAuthenticated, isAdmin } from '@/lib/auth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Loader2, Search, User, X } from 'lucide-react';
import { CURRENCY_SYMBOL } from '@/lib/constants';
import { toast } from 'react-hot-toast';
import { AdminAvatar } from '@/components/admin/AdminIconBadge';
import { Button } from '@/components/ui/Button';
import { useConfirm } from '@/components/providers/UIProvider';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Field } from '@/components/ui/Field';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { useIsMobileNav } from '@/lib/hooks/useMediaQuery';
import { LightShell, LightPanel } from '@/components/dashboard/LightShell';
import { dash } from '@/components/dashboard/lightClasses';

const creditSchema = z.object({
  userId: z.string().min(1, 'User is required'),
  amountCents: z.number().min(0.01, 'Amount must be greater than 0'),
  description: z.string().optional(),
});

type CreditFormData = z.infer<typeof creditSchema>;

interface UserOption {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

export default function CreditWalletPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isMobile = useIsMobileNav();
  const confirm = useConfirm();
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
  } = useForm<CreditFormData>({
    resolver: zodResolver(creditSchema),
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

  const creditMutation = useMutation({
    mutationFn: async (data: CreditFormData) => {
      return apiClient.post('/wallet/admin/credit', {
        userId: data.userId,
        amountCents: Math.round(data.amountCents * 100),
        description: data.description,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-funding'] });
      queryClient.invalidateQueries({ queryKey: ['users'] });
      queryClient.invalidateQueries({ queryKey: ['admin-wallet'] });
      toast.success('Wallet credited successfully');
      router.push('/admin');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to credit wallet');
    },
  });

  const onSubmit = async (data: CreditFormData) => {
    const ok = await confirm({
      title: 'Credit wallet',
      message: 'Add these funds to the user’s wallet?',
      confirmLabel: 'Credit',
    });
    if (ok) creditMutation.mutate(data);
  };

  const handleUserSelect = (user: UserOption) => {
    setSelectedUser(user);
    setValue('userId', user.id);
    setShowUserSearch(false);
    setSearchTerm('');
  };

  const refreshCreditPage = async () => {
    await Promise.all([
      queryClient.invalidateQueries({ queryKey: ['users'] }),
      queryClient.invalidateQueries({ queryKey: ['wallet'] }),
    ]);
  };

  return (
    <AdminGate title="Credit wallet">
      <PullToRefresh onRefresh={refreshCreditPage} disabled={!isMobile} className="max-w-3xl mx-auto">
        <LightShell>
          <p className={dash.subtitle}>Manually credit a user&apos;s wallet</p>

          <LightPanel className="p-6 sm:p-8 space-y-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="relative">
                <label htmlFor="user" className="block text-sm font-semibold text-gray-700 mb-2">
                  Select User *
                </label>
                {selectedUser ? (
                    <div className="flex items-center justify-between p-4 rounded-[16px] border border-brand-maroon/25 bg-brand-maroon/5">
                    <div className="flex items-center gap-3">
                      <AdminAvatar label={selectedUser.email} variant="maroon" />
                      <div>
                        <p className="font-medium text-gray-900">{selectedUser.email}</p>
                        <p className="text-sm text-gray-500">User ID: {selectedUser.id.slice(0, 8)}...</p>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setSelectedUser(null);
                        setValue('userId', '');
                      }}
                      className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-[16px] text-gray-700 hover:bg-black/5 hover:text-gray-900 touch-manipulation"
                      aria-label="Clear user"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>
                ) : (
                  <div className="relative">
                    <Input
                      tone="light"
                      type="text"
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setShowUserSearch(true);
                      }}
                      onFocus={() => setShowUserSearch(true)}
                      placeholder="Search by email or name..."
                      leading={<Search className="h-5 w-5" />}
                    />
                    {showUserSearch && searchTerm && (
                      <div className="absolute z-10 w-full mt-2 rounded-[16px] border border-gray-200 bg-white shadow-lg max-h-64 overflow-y-auto">
                        {usersLoading ? (
                          <div className="p-4 text-center">
                            <Loader2 className="w-5 h-5 animate-spin mx-auto text-brand-maroon" />
                          </div>
                        ) : usersData?.users?.length > 0 ? (
                          usersData.users.map((user: UserOption) => (
                            <button
                              key={user.id}
                              type="button"
                              onClick={() => handleUserSelect(user)}
                              className="w-full min-h-[44px] px-4 py-3 text-left hover:bg-gray-50 flex items-center gap-3 border-b border-gray-100 last:border-0 touch-manipulation"
                            >
                              <AdminAvatar label={user.email} variant="maroon" className="w-8 h-8 text-xs" />
                              <div className="flex-1">
                                <p className="font-medium text-gray-900">{user.email}</p>
                                <p className="text-sm text-gray-500">ID: {user.id.slice(0, 8)}...</p>
                              </div>
                            </button>
                          ))
                        ) : (
                          <div className="p-4 text-center text-[15px] text-[rgba(60,60,67,0.6)]">
                            No users match that search
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
                <input type="hidden" {...register('userId')} />
                {errors.userId && (
                  <p className="mt-1 text-sm text-red-600">{errors.userId.message}</p>
                )}
              </div>

              <Field
                tone="light"
                label={`Amount (${CURRENCY_SYMBOL})`}
                htmlFor="amountCents"
                required
                error={errors.amountCents?.message}
              >
                <Input
                  {...register('amountCents', { valueAsNumber: true })}
                  tone="light"
                  type="number"
                  id="amountCents"
                  step="0.01"
                  min="0.01"
                  placeholder="100.00"
                  className="text-lg font-semibold"
                  leading={<span className="font-medium text-gray-500">{CURRENCY_SYMBOL}</span>}
                  error={!!errors.amountCents}
                />
                {amountGHS ? (
                  <p className="mt-2 text-sm text-gray-500">
                    Will credit:{' '}
                    <span className="font-medium text-gray-900">
                      {Math.round(amountGHS * 100).toLocaleString()}
                    </span>{' '}
                    cents
                  </p>
                ) : null}
              </Field>

              <Field tone="light" label="Description (Optional)" htmlFor="description">
                <Textarea
                  {...register('description')}
                  tone="light"
                  id="description"
                  rows={3}
                  placeholder="e.g., Manual top-up - Bank transfer reference #12345"
                />
              </Field>

              <div className="flex gap-4 pt-4">
                <Button type="button" variant="outline" size="lg" fullWidth onClick={() => router.back()}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="maroon"
                  size="lg"
                  fullWidth
                  disabled={!selectedUser}
                  loading={creditMutation.isPending}
                >
                  <User className="w-5 h-5" />
                  Credit Wallet
                </Button>
              </div>
            </form>
          </LightPanel>
        </LightShell>
      </PullToRefresh>
    </AdminGate>
  );
}
