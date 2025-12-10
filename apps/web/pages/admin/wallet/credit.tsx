import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { isAuthenticated, isAdmin } from '@/lib/auth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Loader2, Search, User, X } from 'lucide-react';
import { toast } from 'react-hot-toast';

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
  const [searchTerm, setSearchTerm] = useState('');
  const [showUserSearch, setShowUserSearch] = useState(false);
  const [selectedUser, setSelectedUser] = useState<UserOption | null>(null);

  useEffect(() => {
    if (!isAuthenticated() || !isAdmin()) {
      router.push('/login');
    }
  }, [router]);

  const { data: usersData, isLoading: usersLoading } = useQuery({
    queryKey: ['users', searchTerm],
    queryFn: async () => {
      const response = await apiClient.get(`/users?search=${encodeURIComponent(searchTerm)}&limit=10`);
      return response.data;
    },
    enabled: showUserSearch && searchTerm.length > 0,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
  } = useForm<CreditFormData>({
    resolver: zodResolver(creditSchema),
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
      queryClient.invalidateQueries({ queryKey: ['users'] });
      toast.success('Wallet credited successfully');
      router.push('/admin');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to credit wallet');
    },
  });

  const onSubmit = (data: CreditFormData) => {
    creditMutation.mutate(data);
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

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900 mb-4 flex items-center gap-2"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Credit Wallet</h1>
          <p className="text-gray-600 mt-1">Manually credit a user's wallet</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-xl shadow-lg p-8 space-y-6">
          {/* User Selection */}
          <div className="relative">
            <label htmlFor="user" className="block text-sm font-semibold text-gray-700 mb-2">
              Select User *
            </label>
            {selectedUser ? (
              <div className="flex items-center justify-between p-4 bg-blue-50 border-2 border-blue-200 rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                    {selectedUser.email[0].toUpperCase()}
                  </div>
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
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            ) : (
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400" />
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
                  className="w-full pl-10 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {showUserSearch && searchTerm && (
                  <div className="absolute z-10 w-full mt-2 bg-white border-2 border-gray-200 rounded-lg shadow-xl max-h-64 overflow-y-auto">
                    {usersLoading ? (
                      <div className="p-4 text-center">
                        <Loader2 className="w-5 h-5 animate-spin mx-auto text-gray-400" />
                      </div>
                    ) : usersData?.users?.length > 0 ? (
                      usersData.users.map((user: UserOption) => (
                        <button
                          key={user.id}
                          type="button"
                          onClick={() => handleUserSelect(user)}
                          className="w-full px-4 py-3 text-left hover:bg-blue-50 flex items-center gap-3 border-b border-gray-100 last:border-0"
                        >
                          <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center text-blue-600 font-semibold text-sm">
                            {user.email[0].toUpperCase()}
                          </div>
                          <div className="flex-1">
                            <p className="font-medium text-gray-900">{user.email}</p>
                            <p className="text-sm text-gray-500">ID: {user.id.slice(0, 8)}...</p>
                          </div>
                        </button>
                      ))
                    ) : (
                      <div className="p-4 text-center text-gray-500">No users found</div>
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

          {/* Amount */}
          <div>
            <label htmlFor="amountCents" className="block text-sm font-semibold text-gray-700 mb-2">
              Amount (GHS) *
            </label>
            <div className="relative">
              <span className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 font-medium">GHS</span>
              <input
                {...register('amountCents', { valueAsNumber: true })}
                type="number"
                id="amountCents"
                step="0.01"
                min="0.01"
                placeholder="100.00"
                className="w-full pl-16 pr-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-lg font-semibold"
              />
            </div>
            {amountGHS && (
              <p className="mt-2 text-sm text-gray-500">
                Will credit: <span className="font-medium">{Math.round(amountGHS * 100).toLocaleString()}</span> cents
              </p>
            )}
            {errors.amountCents && (
              <p className="mt-1 text-sm text-red-600">{errors.amountCents.message}</p>
            )}
          </div>

          {/* Description */}
          <div>
            <label htmlFor="description" className="block text-sm font-semibold text-gray-700 mb-2">
              Description (Optional)
            </label>
            <textarea
              {...register('description')}
              id="description"
              rows={3}
              placeholder="e.g., Manual top-up - Bank transfer reference #12345"
              className="w-full px-4 py-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex gap-4 pt-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-6 py-3 border-2 border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={creditMutation.isPending || !selectedUser}
              className="flex-1 px-6 py-3 bg-gradient-to-r from-green-600 to-green-700 text-white rounded-lg hover:from-green-700 hover:to-green-800 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold shadow-lg transition-all"
            >
              {creditMutation.isPending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Crediting...
                </>
              ) : (
                <>
                  <User className="w-5 h-5" />
                  Credit Wallet
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
