import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { isAuthenticated } from '@/lib/auth';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { toast } from 'react-hot-toast';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/Button';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { useIsMobileNav } from '@/lib/hooks/useMediaQuery';
import { Building2, Smartphone, Star, Trash2, Plus } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/utils';
import type { SavedPayoutMethod } from '@/lib/withdrawal-payout';
import { Sheet } from '@/components/ui/Sheet';
import { form } from '@/lib/form-classes';
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

  if (!isAuthenticated()) return null;

  return (
    <Layout>
      <PullToRefresh onRefresh={refresh} disabled={!isMobile} className="max-w-2xl mx-auto space-y-5">
        <PageHeader
          title="Payout methods"
          subtitle="Saved bank accounts and mobile money wallets for withdrawals"
          icon={<Building2 className="w-6 h-6" />}
          action={
            <Button size="sm" variant="tinted" onClick={() => setAddOpen(true)}>
              <Plus className="w-4 h-4" />
              Add method
            </Button>
          }
        />

        {isLoading ? (
          <div className="h-32 bg-white/10 animate-pulse rounded-ios-xl" />
        ) : methods.length === 0 ? (
          <div className="rounded-ios-xl border border-white/10 bg-white/[0.07] p-8 text-center">
            <Smartphone className="w-12 h-12 mx-auto mb-3 text-white/30" />
            <p className="text-white font-medium mb-1">No saved payout methods</p>
            <p className="text-sm text-white/60 mb-5">
              Save a bank account or mobile money wallet to withdraw faster next time.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button onClick={() => setAddOpen(true)}>Add payout method</Button>
              <Link href="/wallet/withdraw">
                <Button variant="secondary">Request withdrawal</Button>
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {methods.map((method) => {
              const Icon = method.methodType === 'BANK_ACCOUNT' ? Building2 : Smartphone;
              return (
                <div
                  key={method.id}
                  className={cn(
                    'rounded-ios-xl border p-4 bg-white/[0.07]',
                    method.isDefault ? 'border-brand-gold/40 ring-1 ring-brand-gold/20' : 'border-white/10',
                  )}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-ios-lg bg-brand-gold/15 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-brand-gold" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-white">
                          {method.label || method.methodLabel}
                        </p>
                        {method.isDefault && (
                          <span className="text-xs px-2 py-0.5 rounded-full bg-brand-gold/20 text-brand-gold border border-brand-gold/30">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-white/65 mt-0.5">{method.payoutSummary}</p>
                      {method.details.accountName && (
                        <p className="text-xs text-white/50 mt-1">{method.details.accountName}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2 mt-4 pt-3 border-t border-white/10">
                    {!method.isDefault && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => defaultMutation.mutate(method.id)}
                        loading={defaultMutation.isPending}
                      >
                        <Star className="w-4 h-4" />
                        Set default
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => {
                        if (confirm('Remove this payout method?')) {
                          deleteMutation.mutate(method.id);
                        }
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

        <p className="text-xs text-white/50 text-center">
          Payout details are encrypted. Only masked values are shown here.
        </p>
      </PullToRefresh>

      <Sheet
        open={addOpen}
        onClose={closeAddSheet}
        title="Add payout method"
        footer={
          <div className="flex gap-3 px-4">
            <Button type="button" variant="secondary" fullWidth onClick={closeAddSheet}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="add-payout-method-form"
              variant="filled"
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
          <label className="flex items-start gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={setDefault}
              onChange={(e) => setSetDefault(e.target.checked)}
              className={form.checkbox}
            />
            <span className="text-sm text-white/80">Set as default payout method</span>
          </label>
        </form>
      </Sheet>
    </Layout>
  );
}
