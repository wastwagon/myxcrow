import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { isAuthenticated } from '@/lib/auth';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Loader2, AlertCircle, Plus, X } from 'lucide-react';
import { CURRENCY_SYMBOL } from '@/lib/constants';
import { toast } from 'react-hot-toast';

const milestoneSchema = z.object({
  name: z.string().min(1, 'Milestone name is required'),
  description: z.string().optional(),
  amountCents: z.number().min(1, 'Amount must be at least 0.01'),
});

const createEscrowSchema = z.object({
  sellerId: z.string().min(1, 'Seller is required'),
  amountCents: z.number().min(1, 'Amount must be at least ₵1.00'),
  currency: z.string().default('GHS'),
  description: z.string().min(1, 'Description is required'),
  useMilestones: z.boolean().default(false),
  milestones: z.array(milestoneSchema).optional(),
  deliveryRegion: z.string().optional(),
  deliveryCity: z.string().optional(),
  deliveryAddressLine: z.string().optional(),
  deliveryPhone: z.string().optional(),
}).refine((data) => {
  if (data.useMilestones && data.milestones && data.milestones.length > 0) {
    const totalMilestones = data.milestones.reduce((sum, m) => sum + m.amountCents, 0);
    return totalMilestones <= data.amountCents;
  }
  return true;
}, {
  message: 'Total milestone amounts cannot exceed escrow amount',
  path: ['milestones'],
});

type CreateEscrowFormData = z.infer<typeof createEscrowSchema>;

interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
}

export default function CreateEscrowPage() {
  const router = useRouter();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
    }
  }, [router]);

  const { data: users } = useQuery<User[]>({
    queryKey: ['users'],
    queryFn: async () => {
      return [];
    },
    enabled: false,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    control,
  } = useForm<CreateEscrowFormData>({
    resolver: zodResolver(createEscrowSchema),
    defaultValues: {
      currency: 'GHS',
      useWallet: true,
      useMilestones: false,
      milestones: [],
    },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: 'milestones',
  });

  const useMilestones = watch('useMilestones');
  const amountCents = watch('amountCents');
  const milestones = watch('milestones');

  const createMutation = useMutation({
    mutationFn: async (data: CreateEscrowFormData) => {
      const payload: any = {
        ...data,
        useWallet: true, // Always use wallet for escrow funding - Paystack is only for wallet top-up
        amountCents: Math.round(data.amountCents * 100),
        deliveryRegion: data.deliveryRegion || undefined,
        deliveryCity: data.deliveryCity || undefined,
        deliveryAddressLine: data.deliveryAddressLine || undefined,
        deliveryPhone: data.deliveryPhone || undefined,
      };
      if (data.useMilestones && data.milestones && data.milestones.length > 0) {
        payload.milestones = data.milestones.map(m => ({
          ...m,
          amountCents: Math.round(m.amountCents * 100),
        }));
      } else {
        delete payload.milestones;
      }
      delete payload.useMilestones;
      return apiClient.post('/escrows', payload);
    },
    onSuccess: (response) => {
      const escrowId = response.data.id;
      queryClient.invalidateQueries({ queryKey: ['escrows'] });
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      toast.success('Escrow created successfully');
      router.push(`/escrows/${escrowId}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create escrow');
    },
  });

  const onSubmit = (data: CreateEscrowFormData) => {
    createMutation.mutate(data);
  };

  const addMilestone = () => {
    append({ name: '', description: '', amountCents: 0 });
  };

  const totalMilestoneAmount = milestones?.reduce((sum, m) => sum + (m.amountCents || 0), 0) || 0;
  const remainingAmount = (amountCents || 0) - totalMilestoneAmount;

  if (!isAuthenticated()) {
    return null;
  }

  return (
    <Layout>
      <div className="max-w-3xl mx-auto">
        <div className="mb-6">
          <button
            onClick={() => router.back()}
            className="text-white/80 hover:text-white mb-4 flex items-center gap-2 transition-colors"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-bold text-white">Create New Escrow</h1>
          <p className="text-white/90 mt-1">Set up a new escrow agreement</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow p-6 space-y-6">
          <div>
            <label htmlFor="sellerId" className="block text-sm font-medium text-gray-700 mb-1">
              Seller Email *
            </label>
            <input
              {...register('sellerId')}
              type="email"
              id="sellerId"
              placeholder="seller@example.com"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">
              Enter the seller's email address. They will be notified.
            </p>
            {errors.sellerId && (
              <p className="mt-1 text-sm text-red-600">{errors.sellerId.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              {...register('description')}
              id="description"
              rows={4}
              placeholder="Describe the item or service being escrowed..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div className="border-t border-gray-200 pt-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Delivery address (ship to)</h3>
            <p className="text-xs text-gray-500 mb-3">Where the seller should send the item. Only you and the seller see this.</p>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="deliveryRegion" className="block text-sm font-medium text-gray-700 mb-1">Region</label>
                <input
                  {...register('deliveryRegion')}
                  id="deliveryRegion"
                  placeholder="e.g. Greater Accra"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label htmlFor="deliveryCity" className="block text-sm font-medium text-gray-700 mb-1">City / Town</label>
                <input
                  {...register('deliveryCity')}
                  id="deliveryCity"
                  placeholder="e.g. Accra"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
            <div className="mt-4">
              <label htmlFor="deliveryAddressLine" className="block text-sm font-medium text-gray-700 mb-1">Street address / Landmark</label>
              <input
                {...register('deliveryAddressLine')}
                id="deliveryAddressLine"
                placeholder="Street, area, or landmark"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="mt-4">
              <label htmlFor="deliveryPhone" className="block text-sm font-medium text-gray-700 mb-1">Contact phone for delivery (optional)</label>
              <input
                {...register('deliveryPhone')}
                id="deliveryPhone"
                type="tel"
                placeholder="+233XXXXXXXXX"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label htmlFor="amountCents" className="block text-sm font-medium text-gray-700 mb-1">
                Amount ({CURRENCY_SYMBOL}) *
              </label>
              <input
                type="number"
                id="amountCents"
                step="0.01"
                min="1"
                placeholder="100.00"
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                {...register('amountCents', { valueAsNumber: true })}
              />
              <p className="mt-1 text-xs text-gray-500">
                Enter amount in Ghana Cedis
              </p>
              {errors.amountCents && (
                <p className="mt-1 text-sm text-red-600">{errors.amountCents.message}</p>
              )}
            </div>

            <div>
              <input type="hidden" {...register('currency')} value="GHS" />
            </div>
          </div>

          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-800">
                <strong>Note:</strong> The escrow will be funded immediately from your wallet balance.
                Make sure you have sufficient funds.
              </p>
          </div>

          <div className="border-t pt-6">
            <div className="flex items-center mb-4">
              <input
                {...register('useMilestones')}
                type="checkbox"
                id="useMilestones"
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="useMilestones" className="ml-2 text-sm font-medium text-gray-700">
                Use Milestone Payments
              </label>
            </div>
            <p className="text-xs text-gray-500 mb-4">
              Split the escrow into multiple milestone payments. Funds will be released incrementally as milestones are completed.
            </p>

            {useMilestones && (
              <div className="space-y-4">
                {fields.map((field, index) => (
                  <div key={field.id} className="p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="flex items-start justify-between mb-3">
                      <h4 className="font-medium text-gray-900">Milestone {index + 1}</h4>
                      <button
                        type="button"
                        onClick={() => remove(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Milestone Name *
                        </label>
                        <input
                          {...register(`milestones.${index}.name`)}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="e.g., Phase 1, Design Complete"
                        />
                        {errors.milestones?.[index]?.name && (
                          <p className="mt-1 text-xs text-red-600">
                            {errors.milestones[index]?.name?.message}
                          </p>
                        )}
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Description (Optional)
                        </label>
                        <textarea
                          {...register(`milestones.${index}.description`)}
                          rows={2}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="Describe what needs to be completed..."
                        />
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">
                          Amount ({CURRENCY_SYMBOL}) *
                        </label>
                        <input
                          type="number"
                          step="0.01"
                          min="0.01"
                          {...register(`milestones.${index}.amountCents`, { valueAsNumber: true })}
                          className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                          placeholder="0.00"
                        />
                        {errors.milestones?.[index]?.amountCents && (
                          <p className="mt-1 text-xs text-red-600">
                            {errors.milestones[index]?.amountCents?.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}

                <button
                  type="button"
                  onClick={addMilestone}
                  className="flex items-center gap-2 px-4 py-2 text-sm text-blue-600 border border-blue-300 rounded-lg hover:bg-blue-50"
                >
                  <Plus className="w-4 h-4" />
                  Add Milestone
                </button>

                {fields.length > 0 && (
                  <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Total Milestones:</span>
                      <span className="font-medium">{CURRENCY_SYMBOL} {totalMilestoneAmount.toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between text-sm mt-2">
                      <span className="text-gray-600">Remaining Amount:</span>
                      <span className={`font-medium ${remainingAmount < 0 ? 'text-red-600' : 'text-green-600'}`}>
                        {CURRENCY_SYMBOL} {remainingAmount.toFixed(2)}
                      </span>
                    </div>
                    {remainingAmount < 0 && (
                      <p className="mt-2 text-xs text-red-600">
                        Total milestone amounts exceed escrow amount
                      </p>
                    )}
                  </div>
                )}

                {errors.milestones && (
                  <p className="text-sm text-red-600">{errors.milestones.message}</p>
                )}
              </div>
            )}
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
              disabled={createMutation.isPending}
              className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                'Create Escrow'
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
