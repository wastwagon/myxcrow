import { useEffect, useState, useMemo } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { isAuthenticated, isAdmin } from '@/lib/auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { toast } from 'react-hot-toast';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Field } from '@/components/ui/Field';
import { Toggle } from '@/components/ui/Toggle';
import { ListGroup, ListRow } from '@/components/ui/ListGroup';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { useIsMobileNav } from '@/lib/hooks/useMediaQuery';
import { calculateEscrowFees, formatPaidByLabel } from '@/lib/fee-calculator';
import { formatCurrency } from '@/lib/utils';
import { LightShell } from '@/components/dashboard/LightShell';

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

  const [feePreviewAmount, setFeePreviewAmount] = useState(100);
  const [settings, setSettings] = useState<PlatformSettings>({
    fees: { percentage: 5, fixedCents: 0, paidBy: 'split' },
    general: { platformName: 'MYXCROW', supportEmail: 'support@myxcrow.com', maintenanceMode: false },
    security: { requireKYC: true, minPasswordLength: 8, sessionTimeout: 7 },
    notifications: { emailEnabled: true, smsEnabled: false },
  });

  const { data: feeSettings, isLoading: feesLoading } = useQuery({
    queryKey: ['fee-settings'],
    queryFn: async () => {
      const response = await apiClient.get('/settings/fees');
      return response.data;
    },
  });

  const updateMutation = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: unknown }) => {
      return apiClient.put(`/settings/${key}`, { value });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['fee-settings'] });
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
      await updateMutation.mutateAsync({ key: 'fees.percentage', value: feesData.percentage });
      await updateMutation.mutateAsync({ key: 'fees.fixedCents', value: feesData.fixedCents });
      await updateMutation.mutateAsync({ key: 'fees.paidBy', value: feesData.paidBy });
    } else {
      for (const [key, value] of Object.entries(sectionData)) {
        await updateMutation.mutateAsync({
          key: `${section}.${key}`,
          value,
        });
      }
    }
  };

  const saveToggle = (
    section: 'general' | 'security' | 'notifications',
    key: string,
    value: boolean
  ) => {
    setSettings((prev) => ({
      ...prev,
      [section]: { ...prev[section], [key]: value },
    }));
    void updateMutation.mutateAsync({ key: `${section}.${key}`, value });
  };

  const saveAll = async () => {
    try {
      await handleSave('fees');
      await handleSave('general');
      await handleSave('security');
      toast.success('Saved');
    } catch {
      /* onError toast already shown */
    }
  };

  const refreshSettings = async () => {
    await queryClient.invalidateQueries({ queryKey: ['fee-settings'] });
  };

  return (
    <Layout
      title="Settings"
      trailing={
        <button
          type="button"
          onClick={() => void saveAll()}
          disabled={updateMutation.isPending || feesLoading}
          className="shrink-0 min-h-[44px] px-3 text-[17px] font-semibold text-brand-maroon disabled:opacity-50 touch-manipulation"
        >
          {updateMutation.isPending ? 'Saving' : 'Done'}
        </button>
      }
    >
      <PullToRefresh onRefresh={refreshSettings} disabled={!isMobile}>
        <LightShell>
          <ListGroup
            tone="light"
            title="Fees"
            footer="Charged on every new escrow. Percentage plus any fixed amount."
          >
            <div className="px-4 py-3 space-y-3">
              <Field tone="light" label="Percentage (%)" htmlFor="feePercentage">
                <Input
                  id="feePercentage"
                  tone="light"
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
              </Field>
              <Field tone="light" label="Fixed fee (₵)" htmlFor="feeFixed">
                <Input
                  id="feeFixed"
                  tone="light"
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
              </Field>
              <Field tone="light" label="Paid by" htmlFor="feePaidBy">
                <Select
                  id="feePaidBy"
                  tone="light"
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
              </Field>
            </div>
          </ListGroup>

          <ListGroup tone="light" title="Fee preview">
            <div className="px-4 py-3">
              <Field tone="light" label="Example deal (₵)" htmlFor="feePreviewAmount">
                <Input
                  id="feePreviewAmount"
                  tone="light"
                  type="number"
                  min="1"
                  step="1"
                  value={feePreviewAmount}
                  onChange={(e) => setFeePreviewAmount(parseFloat(e.target.value) || 0)}
                />
              </Field>
            </div>
            {feePreview && (
              <>
                <ListRow
                  title="Deal amount"
                  trailing={
                    <span className="text-[17px] text-[rgba(60,60,67,0.6)]">
                      {formatCurrency(feePreview.amountCents, 'GHS')}
                    </span>
                  }
                  showChevron={false}
                />
                {feePreview.buyerFeeCents > 0 && (
                  <ListRow
                    title="Buyer pays"
                    trailing={
                      <span className="text-[17px] text-[rgba(60,60,67,0.6)]">
                        + {formatCurrency(feePreview.buyerFeeCents, 'GHS')}
                      </span>
                    }
                    showChevron={false}
                  />
                )}
                {feePreview.buyerFeeCents > 0 && (
                  <ListRow
                    title="Buyer funds"
                    trailing={
                      <span className="text-[17px] font-semibold text-gray-900">
                        {formatCurrency(feePreview.fundingAmountCents, 'GHS')}
                      </span>
                    }
                    showChevron={false}
                  />
                )}
                {feePreview.sellerFeeCents > 0 && (
                  <ListRow
                    title="Seller pays"
                    trailing={
                      <span className="text-[17px] text-[rgba(60,60,67,0.6)]">
                        − {formatCurrency(feePreview.sellerFeeCents, 'GHS')}
                      </span>
                    }
                    showChevron={false}
                  />
                )}
                <ListRow
                  title="Seller receives"
                  trailing={
                    <span className="text-[17px] font-semibold text-gray-900">
                      {formatCurrency(feePreview.netAmountCents, 'GHS')}
                    </span>
                  }
                  showChevron={false}
                />
                <ListRow
                  title={`Platform (${feePreview.feePercentage}% · ${formatPaidByLabel(feePreview.paidBy)})`}
                  trailing={
                    <span className="text-[17px] text-[rgba(60,60,67,0.6)]">
                      {formatCurrency(feePreview.feeCents, 'GHS')}
                    </span>
                  }
                  showChevron={false}
                />
              </>
            )}
          </ListGroup>

          <ListGroup tone="light" title="General">
            <div className="px-4 py-3 space-y-3">
              <Field tone="light" label="Platform name" htmlFor="platformName">
                <Input
                  id="platformName"
                  tone="light"
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
              <Field tone="light" label="Support email" htmlFor="supportEmail">
                <Input
                  id="supportEmail"
                  tone="light"
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
            </div>
            <ListRow
              title="Maintenance mode"
              subtitle="Pause new deals while you update the platform"
              trailing={
                <Toggle
                  tone="light"
                  id="maintenanceMode"
                  checked={settings.general.maintenanceMode}
                  onCheckedChange={(checked) => saveToggle('general', 'maintenanceMode', checked)}
                  label="Maintenance mode"
                />
              }
              showChevron={false}
            />
          </ListGroup>

          <ListGroup
            tone="light"
            title="Security"
            footer="KYC can be required before funding. Session timeout is in days."
          >
            <ListRow
              title="Require KYC"
              subtitle="Buyers and sellers must verify identity"
              trailing={
                <Toggle
                  tone="light"
                  id="requireKYC"
                  checked={settings.security.requireKYC}
                  onCheckedChange={(checked) => saveToggle('security', 'requireKYC', checked)}
                  label="Require KYC"
                />
              }
              showChevron={false}
            />
            <div className="px-4 py-3 space-y-3">
              <Field tone="light" label="Minimum password length" htmlFor="minPasswordLength">
                <Input
                  id="minPasswordLength"
                  tone="light"
                  type="number"
                  min="6"
                  max="32"
                  value={settings.security.minPasswordLength}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      security: {
                        ...settings.security,
                        minPasswordLength: parseInt(e.target.value, 10) || 8,
                      },
                    })
                  }
                />
              </Field>
              <Field tone="light" label="Session timeout (days)" htmlFor="sessionTimeout">
                <Input
                  id="sessionTimeout"
                  tone="light"
                  type="number"
                  min="1"
                  max="30"
                  value={settings.security.sessionTimeout}
                  onChange={(e) =>
                    setSettings({
                      ...settings,
                      security: {
                        ...settings.security,
                        sessionTimeout: parseInt(e.target.value, 10) || 7,
                      },
                    })
                  }
                />
              </Field>
            </div>
          </ListGroup>

          <ListGroup tone="light" title="Notifications">
            <ListRow
              title="Email"
              trailing={
                <Toggle
                  tone="light"
                  id="emailEnabled"
                  checked={settings.notifications.emailEnabled}
                  onCheckedChange={(checked) => saveToggle('notifications', 'emailEnabled', checked)}
                  label="Email notifications"
                />
              }
              showChevron={false}
            />
            <ListRow
              title="SMS"
              trailing={
                <Toggle
                  tone="light"
                  id="smsEnabled"
                  checked={settings.notifications.smsEnabled}
                  onCheckedChange={(checked) => saveToggle('notifications', 'smsEnabled', checked)}
                  label="SMS notifications"
                />
              }
              showChevron={false}
            />
          </ListGroup>
        </LightShell>
      </PullToRefresh>
    </Layout>
  );
}
