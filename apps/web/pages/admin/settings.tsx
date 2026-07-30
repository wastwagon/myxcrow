import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { isAuthenticated, isAdmin } from '@/lib/auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Settings, Save, DollarSign, Bell, Lock, Globe } from 'lucide-react';
import { toast } from 'react-hot-toast';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Field } from '@/components/ui/Field';
import { Toggle } from '@/components/ui/Toggle';
import { SegmentedControl } from '@/components/ui/SegmentedControl';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { useIsMobileNav } from '@/lib/hooks/useMediaQuery';
import { calculateEscrowFees, formatPaidByLabel } from '@/lib/fee-calculator';
import { formatCurrency } from '@/lib/utils';
import { LightShell, LightPanel } from '@/components/dashboard/LightShell';

interface PlatformSettings {
  fees: {
    percentage: number;
    fixedCents: number;
    paidBy: string;
  };
  general: {
    platformName: string;
    supportEmail: string;
    maintenanceMode: boolean;
  };
  security: {
    requireKYC: boolean;
    minPasswordLength: number;
    sessionTimeout: number;
  };
  notifications: {
    emailEnabled: boolean;
    smsEnabled: boolean;
  };
}

export default function AdminSettingsPage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isMobile = useIsMobileNav();

  useEffect(() => {
    if (!isAuthenticated() || !isAdmin()) {
      router.push('/login');
    }
  }, [router]);

  const settingsTabs = ['fees', 'general', 'security', 'notifications'] as const;
  const [activeTab, setActiveTab] = useState<'fees' | 'general' | 'security' | 'notifications'>('fees');
  const [feePreviewAmount, setFeePreviewAmount] = useState(100);
  const [settings, setSettings] = useState<PlatformSettings>({
    fees: { percentage: 5, fixedCents: 0, paidBy: 'split' },
    general: { platformName: 'MYXCROW', supportEmail: 'support@myxcrow.com', maintenanceMode: false },
    security: { requireKYC: true, minPasswordLength: 8, sessionTimeout: 7 },
    notifications: { emailEnabled: true, smsEnabled: false },
  });

  useEffect(() => {
    const tab = router.query.tab;
    if (typeof tab === 'string' && settingsTabs.includes(tab as (typeof settingsTabs)[number])) {
      setActiveTab(tab as (typeof settingsTabs)[number]);
    }
  }, [router.query.tab]);

  // Fetch fee settings
  const { data: feeSettings, isLoading: feesLoading } = useQuery({
    queryKey: ['fee-settings'],
    queryFn: async () => {
      const response = await apiClient.get('/settings/fees');
      return response.data;
    },
  });

  // Update settings mutation
  const updateMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      return apiClient.put(`/settings/${key}`, { value });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-settings'] });
      toast.success('Settings updated successfully');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to update settings');
    },
  });

  useEffect(() => {
    if (feeSettings) {
      setSettings((prev) => ({
        ...prev,
        fees: {
          percentage: feeSettings.percentage || 5,
          fixedCents: feeSettings.fixedCents || 0,
          paidBy: feeSettings.paidBy || 'buyer',
        },
      }));
    }
  }, [feeSettings]);

  const feePreview = useMemo(() => {
    if (feePreviewAmount < 1) return null;
    return calculateEscrowFees(Math.round(feePreviewAmount * 100), settings.fees);
  }, [feePreviewAmount, settings.fees]);

  if (!isAuthenticated() || !isAdmin()) {
    return null;
  }

  const handleSave = async (section: keyof PlatformSettings) => {
    const sectionData = settings[section];
    if (section === 'fees') {
      const feesData = sectionData as PlatformSettings['fees'];
      await updateMutation.mutateAsync({
        key: 'fees.percentage',
        value: feesData.percentage,
      });
      await updateMutation.mutateAsync({
        key: 'fees.fixedCents',
        value: feesData.fixedCents,
      });
      await updateMutation.mutateAsync({
        key: 'fees.paidBy',
        value: feesData.paidBy,
      });
    } else {
      // For other sections, save individual keys
      for (const [key, value] of Object.entries(sectionData)) {
        await updateMutation.mutateAsync({
          key: `${section}.${key}`,
          value,
        });
      }
    }
  };

  const refreshSettings = async () => {
    await queryClient.invalidateQueries({ queryKey: ['fee-settings'] });
  };

  return (
    <Layout>
      <PullToRefresh onRefresh={refreshSettings} disabled={!isMobile}>
        <LightShell>
        <PageHeader
          tone="light"
          eyebrow="Admin"
          title="Platform Settings"
          subtitle="Configure system-wide settings and preferences"
          icon={<Settings className="w-6 h-6" />}
        />

        {/* Tabs */}
        <LightPanel flush>
          <div className="p-3 border-b border-gray-200">
            <SegmentedControl
              tone="light"
              scrollable
              value={activeTab}
              onChange={setActiveTab}
              options={[
                {
                  value: 'fees',
                  label: (
                    <>
                      <DollarSign className="w-4 h-4" />
                      Fees
                    </>
                  ),
                },
                {
                  value: 'general',
                  label: (
                    <>
                      <Globe className="w-4 h-4" />
                      General
                    </>
                  ),
                },
                {
                  value: 'security',
                  label: (
                    <>
                      <Lock className="w-4 h-4" />
                      Security
                    </>
                  ),
                },
                {
                  value: 'notifications',
                  label: (
                    <>
                      <Bell className="w-4 h-4" />
                      Notifications
                    </>
                  ),
                },
              ]}
            />
          </div>

          <div className="p-6">
            {/* Fees Tab */}
            {activeTab === 'fees' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Fee Configuration</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Percentage Fee (%)
                      </label>
                      <Input
                        type="number"
                        min="0"
                        max="100"
                        step="0.1"
                        value={settings.fees.percentage}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            fees: { ...settings.fees, percentage: parseFloat(e.target.value) || 0 },
                          })
                        }
                      />
                      <p className="mt-1 text-sm text-white/55">
                        Percentage of escrow amount charged as fee (e.g., 5 for 5%)
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Fixed Fee (₵)
                      </label>
                      <Input
                        type="number"
                        min="0"
                        step="0.01"
                        value={settings.fees.fixedCents / 100}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            fees: {
                              ...settings.fees,
                              fixedCents: Math.round(parseFloat(e.target.value) * 100) || 0,
                            },
                          })
                        }
                      />
                      <p className="mt-1 text-sm text-white/55">Fixed amount charged per transaction</p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-white/80 mb-2">
                        Fee Paid By
                      </label>
                      <Select
                        value={settings.fees.paidBy}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            fees: { ...settings.fees, paidBy: e.target.value },
                          })
                        }
                      >
                        <option value="buyer">Buyer</option>
                        <option value="seller">Seller</option>
                        <option value="split">Split (50/50)</option>
                      </Select>
                    </div>

                    <Button
                      type="button"
                      onClick={() => handleSave('fees')}
                      disabled={updateMutation.isPending || feesLoading}
                      loading={updateMutation.isPending}
                      size="lg"
                    >
                      <Save className="w-4 h-4" />
                      Save Fee Settings
                    </Button>
                  </div>
                </div>

                <div className="rounded-xl border border-white/10 bg-white/5 p-5">
                  <h4 className="text-md font-semibold text-white mb-3">Live fee preview</h4>
                  <Field label="Example deal amount (₵)" htmlFor="feePreviewAmount" className="mb-4">
                    <Input
                      id="feePreviewAmount"
                      type="number"
                      min="1"
                      step="1"
                      value={feePreviewAmount}
                      onChange={(e) => setFeePreviewAmount(parseFloat(e.target.value) || 0)}
                    />
                  </Field>
                  {feePreview && (
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between text-white/80">
                        <span>Deal amount</span>
                        <span>{formatCurrency(feePreview.amountCents, 'GHS')}</span>
                      </div>
                      {feePreview.buyerFeeCents > 0 && (
                        <div className="flex justify-between text-white/80">
                          <span>Buyer pays (added)</span>
                          <span className="text-amber-300">+ {formatCurrency(feePreview.buyerFeeCents, 'GHS')}</span>
                        </div>
                      )}
                      {feePreview.buyerFeeCents > 0 && (
                        <div className="flex justify-between font-medium text-white pt-1 border-t border-white/10">
                          <span>Buyer funds from wallet</span>
                          <span>{formatCurrency(feePreview.fundingAmountCents, 'GHS')}</span>
                        </div>
                      )}
                      {feePreview.sellerFeeCents > 0 && (
                        <div className="flex justify-between text-white/80">
                          <span>Seller pays (deducted)</span>
                          <span>− {formatCurrency(feePreview.sellerFeeCents, 'GHS')}</span>
                        </div>
                      )}
                      <div className="flex justify-between text-white/80">
                        <span>Seller receives</span>
                        <span className="text-emerald-400">{formatCurrency(feePreview.netAmountCents, 'GHS')}</span>
                      </div>
                      <div className="flex justify-between text-xs text-white/55 pt-1">
                        <span>Platform fee ({feePreview.feePercentage}% · {formatPaidByLabel(feePreview.paidBy)})</span>
                        <span>{formatCurrency(feePreview.feeCents, 'GHS')}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* General Tab */}
            {activeTab === 'general' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">General Settings</h3>
                  <div className="space-y-4">
                    <Field label="Platform Name" htmlFor="platformName">
                      <Input
                        id="platformName"
                        type="text"
                        value={settings.general.platformName}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            general: { ...settings.general, platformName: e.target.value },
                          })
                        }
                      />
                    </Field>

                    <Field label="Support Email" htmlFor="supportEmail">
                      <Input
                        id="supportEmail"
                        type="email"
                        value={settings.general.supportEmail}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            general: { ...settings.general, supportEmail: e.target.value },
                          })
                        }
                      />
                    </Field>

                    <div className="flex items-center justify-between gap-4 rounded-ios-lg border border-white/10 bg-white/[0.04] px-4 py-3">
                      <label htmlFor="maintenanceMode" className="text-sm font-medium text-white/80">
                        Maintenance Mode
                      </label>
                      <Toggle
                        id="maintenanceMode"
                        checked={settings.general.maintenanceMode}
                        onCheckedChange={(checked) =>
                          setSettings({
                            ...settings,
                            general: { ...settings.general, maintenanceMode: checked },
                          })
                        }
                        label="Maintenance Mode"
                      />
                    </div>

                    <Button
                      type="button"
                      onClick={() => handleSave('general')}
                      disabled={updateMutation.isPending}
                      loading={updateMutation.isPending}
                      size="lg"
                    >
                      <Save className="w-4 h-4" />
                      Save General Settings
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Security Tab */}
            {activeTab === 'security' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Security Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-4 rounded-ios-lg border border-white/10 bg-white/[0.04] px-4 py-3">
                      <label htmlFor="requireKYC" className="text-sm font-medium text-white/80">
                        Require KYC Verification
                      </label>
                      <Toggle
                        id="requireKYC"
                        checked={settings.security.requireKYC}
                        onCheckedChange={(checked) =>
                          setSettings({
                            ...settings,
                            security: { ...settings.security, requireKYC: checked },
                          })
                        }
                        label="Require KYC Verification"
                      />
                    </div>

                    <Field label="Minimum Password Length" htmlFor="minPasswordLength">
                      <Input
                        id="minPasswordLength"
                        type="number"
                        min="6"
                        max="32"
                        value={settings.security.minPasswordLength}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            security: {
                              ...settings.security,
                              minPasswordLength: parseInt(e.target.value) || 8,
                            },
                          })
                        }
                      />
                    </Field>

                    <Field label="Session Timeout (days)" htmlFor="sessionTimeout">
                      <Input
                        id="sessionTimeout"
                        type="number"
                        min="1"
                        max="30"
                        value={settings.security.sessionTimeout}
                        onChange={(e) =>
                          setSettings({
                            ...settings,
                            security: {
                              ...settings.security,
                              sessionTimeout: parseInt(e.target.value) || 7,
                            },
                          })
                        }
                      />
                    </Field>

                    <Button
                      type="button"
                      onClick={() => handleSave('security')}
                      disabled={updateMutation.isPending}
                      loading={updateMutation.isPending}
                      size="lg"
                    >
                      <Save className="w-4 h-4" />
                      Save Security Settings
                    </Button>
                  </div>
                </div>
              </div>
            )}

            {/* Notifications Tab */}
            {activeTab === 'notifications' && (
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-white mb-4">Notification Settings</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between gap-4 rounded-ios-lg border border-white/10 bg-white/[0.04] px-4 py-3">
                      <label htmlFor="emailEnabled" className="text-sm font-medium text-white/80">
                        Enable Email Notifications
                      </label>
                      <Toggle
                        id="emailEnabled"
                        checked={settings.notifications.emailEnabled}
                        onCheckedChange={(checked) =>
                          setSettings({
                            ...settings,
                            notifications: { ...settings.notifications, emailEnabled: checked },
                          })
                        }
                        label="Enable Email Notifications"
                      />
                    </div>

                    <div className="flex items-center justify-between gap-4 rounded-ios-lg border border-white/10 bg-white/[0.04] px-4 py-3">
                      <label htmlFor="smsEnabled" className="text-sm font-medium text-white/80">
                        Enable SMS Notifications
                      </label>
                      <Toggle
                        id="smsEnabled"
                        checked={settings.notifications.smsEnabled}
                        onCheckedChange={(checked) =>
                          setSettings({
                            ...settings,
                            notifications: { ...settings.notifications, smsEnabled: checked },
                          })
                        }
                        label="Enable SMS Notifications"
                      />
                    </div>

                    <Button
                      type="button"
                      onClick={() => handleSave('notifications')}
                      disabled={updateMutation.isPending}
                      loading={updateMutation.isPending}
                      size="lg"
                    >
                      <Save className="w-4 h-4" />
                      Save Notification Settings
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </PullToRefresh>
    </Layout>
  );
}

