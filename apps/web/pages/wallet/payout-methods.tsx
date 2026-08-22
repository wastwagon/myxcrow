import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import CustomerLayout from '@/components/CustomerLayout';
import { isAuthenticated } from '@/lib/auth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { useConfirm } from '@/components/providers/UIProvider';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { useIsMobileNav } from '@/lib/hooks/useMediaQuery';
import { Building2, Smartphone, Star, Trash2 } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { Checkbox } from '@/components/ui/Checkbox';
import { cn } from '@/lib/utils';
import type { SavedPayoutMethod } from '@/lib/withdrawal-payout';
import { Sheet } from '@/components/ui/Sheet';
import { form } from '@/lib/form-classes';
import { PageSpinner } from '@/components/LoadingSkeleton';
import { PayoutDetailsFields } from '@/components/wallet/PayoutDetailsFields';
import {
  payoutDetailsFormSchema,
  toMethodDetailsPayload,
  type PayoutDetailsFormData,
} from '@/lib/payout-form-schema';

export default function PayoutMethodsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isMobile = useIsMobileNav();
  const confirm = useConfirm();
  const [addOpen, setAddOpen] = useState(false);
  const [label, setLabel] = useState('');
  const [setDefault, setSetDefault] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) router.push('/login');
  }, [router]);

  const { data: methods = [], isLoading } = useQuery<SavedPayoutMethod[]>({
    queryKey: ['payout-methods'],
    queryFn: async () => {
      const res = await apiClient.get('/wallet/payout-methods');
      return res.data;
    },
  });

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm<PayoutDetailsFormData>({
    resolver: zodResolver(payoutDetailsFormSchema),
    defaultValues: { methodType: 'BANK_ACCOUNT' },
  });

  const methodType = watch('methodType');

  const closeAddSheet = () => {
    setAddOpen(false);
    setLabel('');
    setSetDefault(false);
    reset({ methodType: 'BANK_ACCOUNT' });
  };

  const createMutation = useMutation({
    mutationFn: async (data: PayoutDetailsFormData) =>
      apiClient.post('/wallet/payout-methods', {
        methodType: data.methodType,
        methodDetails: toMethodDetailsPayload(data),
        label: label.trim() || undefined,
        setDefault,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payout-methods'] });
      toast.success('Payout method saved');
      closeAddSheet();
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Failed to save payout method');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => apiClient.delete(`/wallet/payout-methods/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payout-methods'] });
      toast.success('Payout method removed');
    },
    onError: () => toast.error('Failed to remove payout method'),
  });

  const defaultMutation = useMutation({
    mutationFn: async (id: string) => apiClient.put(`/wallet/payout-methods/${id}/default`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payout-methods'] });
      toast.success('Default payout method updated');
    },
    onError: () => toast.error('Failed to update default'),
  });

  const refresh = async () => {
    await queryClient.invalidateQueries({ queryKey: ['payout-methods'] });
  };

  if (!isAuthenticated()) return <PageSpinner />;

  return (
    <CustomerLayout
      title="Payout methods"
      back
      trailing={
        <button
          type="button"
          onClick={() => setAddOpen(true)}
          className="min-h-[44px] px-2 text-[17px] font-semibold text-brand-maroon touch-manipulation"
        >
          Add
        </button>
      }
    >
      <PullToRefresh onRefresh={refresh} disabled={!isMobile} className="space-y-5">
        {isLoading ? (
          <div className="h-32 bg-white animate-pulse rounded-[20px]" />
        ) : methods.length === 0 ? (
          <div className="rounded-[20px] bg-white">
            <EmptyState
              tone="light"
              icon={<Smartphone className="w-6 h-6" />}
              title="No saved payout methods"
              description="Save a bank account or mobile money wallet to withdraw faster next time."
              action={{ label: 'Add payout method', onClick: () => setAddOpen(true), variant: 'maroon' }}
            />
          </div>
        ) : (
          <div className="space-y-3">
            {methods.map((method) => {
              const Icon = method.methodType === 'BANK_ACCOUNT' ? Building2 : Smartphone;
              return (
                <div
                  key={method.id}
                  className={cn(
                    'rounded-[20px] bg-white p-4',
                    method.isDefault && 'ring-1 ring-brand-maroon/25'
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-[20px] bg-brand-maroon/10 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-brand-maroon" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-gray-900">
                          {method.label || method.methodLabel}
                        </p>
                        {method.isDefault && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-brand-maroon/10 text-brand-maroon">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-[rgba(60,60,67,0.6)] mt-0.5">{method.payoutSummary}</p>
                      {method.details.accountName && (
                        <p className="text-xs text-gray-500 mt-1">{method.details.accountName}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4 pt-3 border-t border-[rgba(60,60,67,0.12)]">
                    {!method.isDefault && (
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={async () => {
                          const ok = await confirm({
                            title: 'Default payout method',
                            message: 'Use this method for withdrawals?',
                            confirmLabel: 'Set default',
                          });
                          if (ok) defaultMutation.mutate(method.id);
                        }}
                        loading={defaultMutation.isPending}
                      >
                        <Star className="w-4 h-4" />
                        Set default
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={async () => {
                        const ok = await confirm({
                          title: 'Remove payout method',
                          message: 'Remove this payout method? You can add it again later.',
                          confirmLabel: 'Remove',
                          destructive: true,
                        });
                        if (ok) deleteMutation.mutate(method.id);
                      }}
                      loading={deleteMutation.isPending}
                    >
                      <Trash2 className="w-4 h-4" />
                      Remove
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-[13px] text-[rgba(60,60,67,0.6)] text-center">
          Payout details are encrypted. Only masked values are shown here.
        </p>
      </PullToRefresh>

      <Sheet
        open={addOpen}
        onClose={closeAddSheet}
        title="Add payout method"
        tone="light"
        footer={
          <div className="flex gap-3 px-4">
            <Button type="button" variant="outline" fullWidth onClick={closeAddSheet}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="add-payout-method-form"
              variant="maroon"
              fullWidth
              loading={createMutation.isPending}
            >
              Save method
            </Button>
          </div>
        }
      >
        <form
          id="add-payout-method-form"
          onSubmit={handleSubmit((data) => createMutation.mutate(data))}
          className="px-4 pb-4 space-y-4 overflow-y-auto"
        >
          <PayoutDetailsFields
            register={register}
            errors={errors}
            methodType={methodType}
            setValue={setValue}
          />
          <div>
            <label htmlFor="methodLabel" className={form.label}>
              Label (optional)
            </label>
            <input
              id="methodLabel"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="e.g. My salary account"
              className={form.input}
            />
          </div>
          <Checkbox
            id="set-default-payout"
            tone="light"
            checked={setDefault}
            onChange={(e) => setSetDefault(e.target.checked)}
            label="Set as default payout method"
          />
        </form>
      </Sheet>
    </CustomerLayout>
  );
}
