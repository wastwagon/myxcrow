import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { isAuthenticated, isAdmin } from '@/lib/auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { DollarSign, Percent, Users, Save, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/Button';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { useIsMobileNav } from '@/lib/hooks/useMediaQuery';

interface FeeSettings {
  percentage: number;
  fixedCents: number;
  paidBy: 'buyer' | 'seller' | 'split';
}

export default function FeesConfigPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isMobile = useIsMobileNav();
  const [percentage, setPercentage] = useState(0);
  const [fixedCents, setFixedCents] = useState(0);
  const [feePaidBy, setFeePaidBy] = useState<'buyer' | 'seller' | 'split'>('buyer');

  useEffect(() => {
    if (!isAuthenticated() || !isAdmin()) {
      router.push('/login');
    }
  }, [router]);

  const { data: settings, isLoading } = useQuery<FeeSettings>({
    queryKey: ['fee-settings'],
    queryFn: async () => {
      const response = await apiClient.get('/settings/fees');
      return response.data;
    },
  });

  useEffect(() => {
    if (settings) {
      setPercentage(settings.percentage || 0);
      setFixedCents(settings.fixedCents || 0);
      setFeePaidBy(settings.paidBy || 'buyer');
    }
  }, [settings]);

  const updateMutation = useMutation({
    mutationFn: async (data: Partial<FeeSettings>) => {
      return apiClient.put('/settings/fees', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-settings'] });
      toast.success('Fee settings updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update fee settings');
    },
  });

  const handleSave = () => {
    updateMutation.mutate({
      percentage,
      fixedCents,
      paidBy: feePaidBy,
    });
  };

  const calculateExampleFee = (amountCents: number) => {
    const percentageFee = Math.round((amountCents * percentage) / 100);
    const totalFee = percentageFee + fixedCents;
    return {
      amount: amountCents / 100,
      percentageFee: percentageFee / 100,
      fixedFee: fixedCents / 100,
      totalFee: totalFee / 100,
      netAmount: (amountCents - totalFee) / 100,
    };
  };

  const example1 = calculateExampleFee(10000); // 100 ₵
  const example2 = calculateExampleFee(50000); // 500 ₵
  const example3 = calculateExampleFee(100000); // 1000 ₵

  if (!isAuthenticated() || !isAdmin()) {
    return null;
  }

  const refreshFees = async () => {
    await queryClient.invalidateQueries({ queryKey: ['fee-settings'] });
  };

  return (
    <Layout>
      <PullToRefresh onRefresh={refreshFees} disabled={!isMobile} className="space-y-6">
        <PageHeader
          title="Platform Fees Configuration"
          subtitle="Configure escrow fees and who pays them"
          icon={<DollarSign className="w-6 h-6 text-white" />}
          gradient="purple"
        />

        <div className="rounded-ios-xl border border-amber-500/35 bg-amber-500/15 p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-400 mt-0.5" />
          <div>
            <p className="font-medium text-amber-200">Important</p>
            <p className="text-sm text-amber-100/90 mt-1">
              Changes to fee settings will apply to all new escrows. Existing escrows will keep their original fee structure.
            </p>
          </div>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Fee Configuration */}
          <div className="rounded-ios-xl border border-white/10 bg-white/[0.07] backdrop-blur-sm shadow-ios-card p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Fee Structure</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  <Percent className="w-4 h-4 inline mr-1" />
                  Percentage Fee (%)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  max="100"
                  value={percentage}
                  onChange={(e) => setPercentage(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 border border-white/20 rounded-lg focus:ring-2 focus:ring-brand-gold focus:border-brand-gold/50 outline-none"
                />
                <p className="text-xs text-white/55 mt-1">Percentage of escrow amount</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  <DollarSign className="w-4 h-4 inline mr-1" />
                  Fixed Fee (₵)
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={fixedCents / 100}
                  onChange={(e) => setFixedCents(Math.round((parseFloat(e.target.value) || 0) * 100))}
                  className="w-full px-3 py-2 border border-white/20 rounded-lg focus:ring-2 focus:ring-brand-gold focus:border-brand-gold/50 outline-none"
                />
                <p className="text-xs text-white/55 mt-1">Fixed amount in addition to percentage</p>
              </div>

              <div>
                <label className="block text-sm font-medium text-white/80 mb-2">
                  <Users className="w-4 h-4 inline mr-1" />
                  Fee Paid By
                </label>
                <select
                  value={feePaidBy}
                  onChange={(e) => setFeePaidBy(e.target.value as 'buyer' | 'seller' | 'split')}
                  className="w-full px-3 py-2 border border-white/20 rounded-lg focus:ring-2 focus:ring-brand-gold focus:border-brand-gold/50 outline-none"
                >
                  <option value="buyer">Buyer</option>
                  <option value="seller">Seller</option>
                  <option value="split">Split (50/50)</option>
                </select>
                <p className="text-xs text-white/55 mt-1">Who pays the escrow fee</p>
              </div>

              <Button
                type="button"
                onClick={handleSave}
                disabled={updateMutation.isPending}
                loading={updateMutation.isPending}
                fullWidth
                size="lg"
              >
                <Save className="w-4 h-4" />
                Save Fee Settings
              </Button>
            </div>
          </div>

          {/* Fee Examples */}
          <div className="rounded-ios-xl border border-white/10 bg-white/[0.07] backdrop-blur-sm shadow-ios-card p-6">
            <h2 className="text-xl font-semibold text-white mb-4">Fee Examples</h2>
            <div className="space-y-4">
              <div className="border border-white/10 rounded-lg p-4">
                <p className="font-medium text-white mb-2">Escrow Amount: {example1.amount.toFixed(2)} ₵</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/70">Percentage Fee ({percentage}%):</span>
                    <span className="font-medium">{example1.percentageFee.toFixed(2)} ₵</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Fixed Fee:</span>
                    <span className="font-medium">{example1.fixedFee.toFixed(2)} ₵</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="font-medium text-white">Total Fee:</span>
                    <span className="font-bold text-white">{example1.totalFee.toFixed(2)} ₵</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Net Amount (to seller):</span>
                    <span className="font-medium text-emerald-400">{example1.netAmount.toFixed(2)} ₵</span>
                  </div>
                </div>
              </div>

              <div className="border border-white/10 rounded-lg p-4">
                <p className="font-medium text-white mb-2">Escrow Amount: {example2.amount.toFixed(2)} ₵</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/70">Percentage Fee ({percentage}%):</span>
                    <span className="font-medium">{example2.percentageFee.toFixed(2)} ₵</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Fixed Fee:</span>
                    <span className="font-medium">{example2.fixedFee.toFixed(2)} ₵</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="font-medium text-white">Total Fee:</span>
                    <span className="font-bold text-white">{example2.totalFee.toFixed(2)} ₵</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Net Amount (to seller):</span>
                    <span className="font-medium text-emerald-400">{example2.netAmount.toFixed(2)} ₵</span>
                  </div>
                </div>
              </div>

              <div className="border border-white/10 rounded-lg p-4">
                <p className="font-medium text-white mb-2">Escrow Amount: {example3.amount.toFixed(2)} ₵</p>
                <div className="space-y-1 text-sm">
                  <div className="flex justify-between">
                    <span className="text-white/70">Percentage Fee ({percentage}%):</span>
                    <span className="font-medium">{example3.percentageFee.toFixed(2)} ₵</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Fixed Fee:</span>
                    <span className="font-medium">{example3.fixedFee.toFixed(2)} ₵</span>
                  </div>
                  <div className="flex justify-between pt-2 border-t">
                    <span className="font-medium text-white">Total Fee:</span>
                    <span className="font-bold text-white">{example3.totalFee.toFixed(2)} ₵</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-white/70">Net Amount (to seller):</span>
                    <span className="font-medium text-emerald-400">{example3.netAmount.toFixed(2)} ₵</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </PullToRefresh>
    </Layout>
  );
}

