import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { isAuthenticated } from '@/lib/auth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';

const disputeSchema = z.object({
  escrowId: z.string().min(1, 'Escrow ID is required'),
  reason: z.enum(['NOT_RECEIVED', 'DAMAGED', 'WRONG_ITEM', 'OTHER'], {
    required_error: 'Please select a reason',
  }),
  description: z.string().min(10, 'Description must be at least 10 characters'),
});

type DisputeFormData = z.infer<typeof disputeSchema>;

export default function CreateDisputePage() {
  const router = useRouter();
  const { escrowId } = router.query;
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
    }
  }, [router]);

  const { data: escrow } = useQuery({
    queryKey: ['escrow', escrowId],
    queryFn: async () => {
      const response = await apiClient.get(`/escrows/${escrowId}`);
      return response.data;
    },
    enabled: !!escrowId,
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<DisputeFormData>({
    resolver: zodResolver(disputeSchema),
    defaultValues: {
      escrowId: escrowId as string,
    },
  });

  useEffect(() => {
    if (escrowId) {
      setValue('escrowId', escrowId as string);
    }
  }, [escrowId, setValue]);

  const createMutation = useMutation({
    mutationFn: async (data: DisputeFormData) => {
      return apiClient.post('/disputes', data);
    },
    onSuccess: (response) => {
      const disputeId = response.data.id;
      queryClient.invalidateQueries({ queryKey: ['escrows'] });
      queryClient.invalidateQueries({ queryKey: ['disputes'] });
      toast.success('Dispute created successfully');
      router.push(`/disputes/${disputeId}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create dispute');
    },
  });

  const onSubmit = (data: DisputeFormData) => {
    createMutation.mutate(data);
  };

  if (!isAuthenticated()) {
    return null;
  }

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
          <h1 className="text-3xl font-bold text-gray-900">Open Dispute</h1>
          <p className="text-gray-600 mt-1">Create a dispute for this escrow</p>
        </div>

        {escrow && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <p className="text-sm text-blue-800">
              <strong>Escrow:</strong> {escrow.description || escrow.id}
            </p>
            <p className="text-sm text-blue-800 mt-1">
              <strong>Amount:</strong> {formatCurrency(escrow.amountCents, 'GHS')}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="bg-white rounded-lg shadow p-6 space-y-6">
          <input type="hidden" {...register('escrowId')} />

          <div>
            <label htmlFor="reason" className="block text-sm font-medium text-gray-700 mb-1">
              Reason for Dispute *
            </label>
            <select
              {...register('reason')}
              id="reason"
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">Select a reason</option>
              <option value="NOT_RECEIVED">Item Not Received</option>
              <option value="DAMAGED">Item Damaged</option>
              <option value="WRONG_ITEM">Wrong Item Received</option>
              <option value="OTHER">Other</option>
            </select>
            {errors.reason && (
              <p className="mt-1 text-sm text-red-600">{errors.reason.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-1">
              Description *
            </label>
            <textarea
              {...register('description')}
              id="description"
              rows={6}
              placeholder="Please provide details about the issue..."
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p className="mt-1 text-xs text-gray-500">Minimum 10 characters</p>
            {errors.description && (
              <p className="mt-1 text-sm text-red-600">{errors.description.message}</p>
            )}
          </div>

          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div className="text-sm text-yellow-800">
                <p className="font-medium mb-1">Important:</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Opening a dispute will change the escrow status to DISPUTED</li>
                  <li>Funds will be held until the dispute is resolved</li>
                  <li>Both parties can add messages to the dispute</li>
                  <li>An admin will review and resolve the dispute</li>
                </ul>
              </div>
            </div>
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
              className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              {createMutation.isPending ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <AlertCircle className="w-4 h-4" />
                  Open Dispute
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </Layout>
  );
}

