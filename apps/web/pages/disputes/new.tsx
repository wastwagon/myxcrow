import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { isAuthenticated } from '@/lib/auth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { formatCurrency } from '@/lib/utils';
import { form } from '@/lib/form-classes';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/Button';

const disputeSchema = z.object({
  escrowId: z.string().min(1, 'Escrow ID is required'),
  reason: z.enum(
    ['NOT_RECEIVED', 'NOT_AS_DESCRIBED', 'DEFECTIVE', 'WRONG_ITEM', 'PARTIAL_DELIVERY', 'OTHER'],
    { required_error: 'Please select a reason' }
  ),
  description: z.string().min(10, 'Description must be at least 10 characters'),
});

type DisputeFormData = z.infer<typeof disputeSchema>;

export default function CreateDisputePage() {
  const router = useRouter();
  const { escrowId } = router.query;
  const queryClient = useQueryClient();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted && !isAuthenticated()) {
      router.push('/login');
    }
  }, [mounted, router]);

  const { data: escrow } = useQuery({
    queryKey: ['escrow', escrowId],
    queryFn: async () => {
      const response = await apiClient.get(`/escrows/${escrowId}`);
      return response.data;
    },
    enabled: mounted && !!escrowId && isAuthenticated(),
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
  } = useForm<DisputeFormData>({
    resolver: zodResolver(disputeSchema),
    defaultValues: { escrowId: escrowId as string },
  });

  useEffect(() => {
    if (escrowId) setValue('escrowId', escrowId as string);
  }, [escrowId, setValue]);

  const createMutation = useMutation({
    mutationFn: async (data: DisputeFormData) => apiClient.post('/disputes', data),
    onSuccess: (response) => {
      queryClient.invalidateQueries({ queryKey: ['escrows'] });
      queryClient.invalidateQueries({ queryKey: ['disputes'] });
      toast.success('Dispute created successfully');
      router.push(`/disputes/${response.data.id}`);
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Failed to create dispute');
    },
  });

  if (!mounted || !isAuthenticated()) return null;

  return (
    <Layout>
      <div className="max-w-2xl mx-auto space-y-6">
        <PageHeader
          eyebrow="Resolution"
          title="Open dispute"
          subtitle="Create a dispute for this escrow"
          icon={<AlertCircle className="w-6 h-6" />}
        />

        {escrow && (
          <div className={form.calloutInfo}>
            <p className="text-ios-subhead text-label-primary">
              <span className="text-label-secondary">Escrow: </span>
              {escrow.description || escrow.id}
            </p>
            <p className="text-ios-subhead text-label-primary mt-1">
              <span className="text-label-secondary">Amount: </span>
              {formatCurrency(escrow.amountCents, 'GHS')}
            </p>
          </div>
        )}

        <form onSubmit={handleSubmit((d) => createMutation.mutate(d))} className={`${form.panel} space-y-6`}>
          <input type="hidden" {...register('escrowId')} />

          <div>
            <label htmlFor="reason" className={form.label}>
              Reason for dispute *
            </label>
            <select {...register('reason')} id="reason" className={form.input}>
              <option value="">Select a reason</option>
              <option value="NOT_RECEIVED">Item not received</option>
              <option value="NOT_AS_DESCRIBED">Not as described</option>
              <option value="DEFECTIVE">Item defective / damaged</option>
              <option value="WRONG_ITEM">Wrong item received</option>
              <option value="PARTIAL_DELIVERY">Partial delivery</option>
              <option value="OTHER">Other</option>
            </select>
            {errors.reason && <p className={form.inputError}>{errors.reason.message}</p>}
          </div>

          <div>
            <label htmlFor="description" className={form.label}>
              Description *
            </label>
            <textarea
              {...register('description')}
              id="description"
              rows={6}
              placeholder="Please provide details about the issue…"
              className={`${form.input} resize-none`}
            />
            <p className="mt-1 text-ios-caption text-label-tertiary">Minimum 10 characters</p>
            {errors.description && <p className={form.inputError}>{errors.description.message}</p>}
          </div>

          <div className={form.calloutWarning}>
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5 shrink-0" />
              <div className="text-sm text-amber-100/90">
                <p className="font-medium text-amber-200 mb-1">Important</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Opening a dispute sets the escrow status to DISPUTED</li>
                  <li>Funds are held until the dispute is resolved</li>
                  <li>Both parties can add messages</li>
                  <li>An admin will review and resolve the dispute</li>
                </ul>
              </div>
            </div>
          </div>

          <div className="flex gap-4">
            <Button type="button" variant="secondary" size="lg" fullWidth onClick={() => router.back()}>
              Cancel
            </Button>
            <Button
              type="submit"
              variant="destructive"
              size="lg"
              fullWidth
              loading={createMutation.isPending}
            >
              <AlertCircle className="w-4 h-4" />
              Open dispute
            </Button>
          </div>
        </form>
      </div>
    </Layout>
  );
}
