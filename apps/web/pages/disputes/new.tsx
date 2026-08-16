import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import CustomerLayout from '@/components/CustomerLayout';
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
import { Button } from '@/components/ui/Button';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { useConfirm } from '@/components/providers/UIProvider';

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
  const confirm = useConfirm();
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
    <CustomerLayout title="New dispute" back>
      <div className="space-y-6">
        {escrow && (
          <div className={form.calloutInfo}>
            <p className="text-[15px] text-gray-900">
              <span className="text-[rgba(60,60,67,0.6)]">Escrow: </span>
              {escrow.description || escrow.id}
            </p>
            <p className="text-[15px] text-gray-900 mt-1">
              <span className="text-[rgba(60,60,67,0.6)]">Amount: </span>
              {formatCurrency(escrow.amountCents, 'GHS')}
            </p>
          </div>
        )}

        <form
          onSubmit={handleSubmit(async (d) => {
            const ok = await confirm({
              title: 'Open dispute',
              message: 'This holds funds until the dispute is resolved. Continue?',
              confirmLabel: 'Open dispute',
              destructive: true,
            });
            if (ok) createMutation.mutate(d);
          })}
          className={`${form.panel} space-y-6`}
        >
          <input type="hidden" {...register('escrowId')} />

          <div>
            <label htmlFor="reason" className={form.label}>
              Reason for dispute *
            </label>
            <Select {...register('reason')} id="reason" tone="light" error={!!errors.reason}>
              <option value="">Select a reason</option>
              <option value="NOT_RECEIVED">Item not received</option>
              <option value="NOT_AS_DESCRIBED">Not as described</option>
              <option value="DEFECTIVE">Item defective / damaged</option>
              <option value="WRONG_ITEM">Wrong item received</option>
              <option value="PARTIAL_DELIVERY">Partial delivery</option>
              <option value="OTHER">Other</option>
            </Select>
            {errors.reason && <p className={form.inputError}>{errors.reason.message}</p>}
          </div>

          <div>
            <label htmlFor="description" className={form.label}>
              Description *
            </label>
            <Textarea
              {...register('description')}
              id="description"
              tone="light"
              rows={6}
              placeholder="Please provide details about the issue…"
              className="resize-none"
              error={!!errors.description}
            />
            <p className="mt-1 text-ios-caption text-gray-500">Minimum 10 characters</p>
            {errors.description && <p className={form.inputError}>{errors.description.message}</p>}
          </div>

          <div className="rounded-[12px] border border-amber-500/25 bg-amber-50 p-4">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-5 h-5 text-amber-700 mt-0.5 shrink-0" />
              <div className="text-sm text-amber-900">
                <p className="font-medium mb-1">Important</p>
                <ul className="list-disc list-inside space-y-1">
                  <li>Opening a dispute sets the escrow status to DISPUTED</li>
                  <li>Funds are held until the dispute is resolved</li>
                  <li>Both parties can add messages</li>
                  <li>An admin will review and resolve the dispute</li>
                </ul>
              </div>
            </div>
          </div>

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
        </form>
      </div>
    </CustomerLayout>
  );
}
