import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { isAuthenticated } from '@/lib/auth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { formatCurrency } from '@/lib/utils';
import { Loader2, ArrowUpCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

const withdrawalSchema = z.object({
  amountCents: z.number().min(100, 'Amount must be at least 1.00'),
  methodType: z.enum(['BANK_TRANSFER', 'MOBILE_MONEY'], {
    required_error: 'Please select a withdrawal method',
  }),
  accountNumber: z.string().min(1, 'Account number is required'),
  bankName: z.string().optional(),
  mobileNumber: z.string().optional(),
  network: z.enum(['MTN', 'VODAFONE', 'AIRTELTIGO']).optional(),
});

type WithdrawalFormData = z.infer<typeof withdrawalSchema>;

export default function WithdrawPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
    }
  }, [router]);

  const { data: wallet } = useQuery({
    queryKey: ['wallet'],
    queryFn: async () => {
      const response = await apiClient.get('/wallet');
      return response.data;
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
  } = useForm<WithdrawalFormData>({
    resolver: zodResolver(withdrawalSchema),
  });

  const methodType = watch('methodType');

  const withdrawMutation = useMutation({
    mutationFn: async (data: WithdrawalFormData) => {
      const methodDetails: any = {};
      if (data.methodType === 'BANK_TRANSFER') {
        methodDetails.accountNumber = data.accountNumber;
        methodDetails.bankName = data.bankName;
      } else {
        methodDetails.mobileNumber = data.mobileNumber;
        methodDetails.network = data.network;
      }

      return apiClient.post('/wallet/withdraw', {
        amountCents: Math.round(data.amountCents * 100),
        methodType: data.methodType,
        methodDetails,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['wallet-withdrawals'] });
      toast.success('Withdrawal request submitted');
      router.push('/wallet');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to request withdrawal');
    },
  });

  const onSubmit = (data: WithdrawalFormData) => {
    withdrawMutation.mutate(data);
  };

  if (!isAuthenticated()) {
    return null;
  }

  const availableBalance = wallet ? wallet.availableCents / 100 : 0;

  return (
    <Layout>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900 mb-4"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold text-gray-900">Request Withdrawal</h1>
          <p className="text-gray-600 mt-1">Withdraw funds from your wallet</p>
        </div>

        {wallet && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Available Balance:</strong> {formatCurrency(availableBalance * 100, 'GHS')}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow p-6 space-y-6">
          <div>
            <label htmlFor="amountCents" className="block text-sm font-medium text-gray-700 mb-1">
              Amount (GHS) *
            </label>
            <input
              {...register('amountCents', { valueAsNumber: true })}
              type="number"
              id="amountCents"
              step="0.01"
              min="1"
              max={availableBalance}
              placeholder="100.00"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.amountCents && (
              <p className="mt-1 text-sm text-red-600">{errors.amountCents.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="methodType" className="block text-sm font-medium text-gray-700 mb-1">
              Withdrawal Method *
            </label>
            <select
              {...register('methodType')}
              id="methodType"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select method</option>
              <option value="BANK_TRANSFER">Bank Transfer</option>
              <option value="MOBILE_MONEY">Mobile Money</option>
            </select>
            {errors.methodType && (
              <p className="mt-1 text-sm text-red-600">{errors.methodType.message}</p>
            )}
          </div>

          {methodType === 'BANK_TRANSFER' && (
            <>
              <div>
                <label htmlFor="accountNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  Account Number *
                </label>
                <input
                  {...register('accountNumber')}
                  type="text"
                  id="accountNumber"
                  placeholder="1234567890"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.accountNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.accountNumber.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="bankName" className="block text-sm font-medium text-gray-700 mb-1">
                  Bank Name
                </label>
                <input
                  {...register('bankName')}
                  type="text"
                  id="bankName"
                  placeholder="e.g., GCB Bank"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </>
          )}

          {methodType === 'MOBILE_MONEY' && (
            <>
              <div>
                <label htmlFor="mobileNumber" className="block text-sm font-medium text-gray-700 mb-1">
                  Mobile Number *
                </label>
                <input
                  {...register('mobileNumber')}
                  type="tel"
                  id="mobileNumber"
                  placeholder="0244123456"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
                {errors.mobileNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.mobileNumber.message}</p>
                )}
              </div>
              <div>
                <label htmlFor="network" className="block text-sm font-medium text-gray-700 mb-1">
                  Network *
                </label>
                <select
                  {...register('network')}
                  id="network"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option value="">Select network</option>
                  <option value="MTN">MTN</option>
                  <option value="VODAFONE">Vodafone</option>
                  <option value="AIRTELTIGO">AirtelTigo</option>
                </select>
                {errors.network && (
                  <p className="mt-1 text-sm text-red-600">{errors.network.message}</p>
                )}
              </div>
            </>
          )}

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              <strong>Note:</strong> Withdrawal requests are processed manually by administrators.
              You will be notified once your request is approved or denied.
            </p>
          </div>

          <div className="flex gap-4">
            <button
              type="button"
              onClick={() => router.back()}
              className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={withdrawMutation.isPending}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {withdrawMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                <>
                  <ArrowUpCircle className="w-4 h-4" />
                  Request Withdrawal
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}

