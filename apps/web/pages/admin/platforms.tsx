import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { isAuthenticated, isAdmin } from '@/lib/auth';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { KeyRound, Plus, Trash2 } from 'lucide-react';
import { EmptyState } from '@/components/ui/EmptyState';
import { toast } from 'react-hot-toast';
import { Button } from '@/components/ui/Button';
import { useConfirm } from '@/components/providers/UIProvider';
import { Field } from '@/components/ui/Field';
import { Input } from '@/components/ui/Input';
import { LightShell, LightPanel } from '@/components/dashboard/LightShell';
import { dash } from '@/components/dashboard/lightClasses';
import { PageSpinner } from '@/components/LoadingSkeleton';
import {
  TableShell,
  Table,
  TableHead,
  TableBody,
  TableRow,
  TableTh,
  TableTd,
  TableEmpty,
} from '@/components/ui/Table';

type Platform = {
  id: string;
  name: string;
  slug: string;
  isActive: boolean;
  releasePolicy: string;
  createdAt: string;
};

type ApiKeyRow = {
  id: string;
  keyId: string;
  lastFour: string;
  keyType: string;
  environment: string;
  name: string | null;
  revokedAt: string | null;
  createdAt: string;
};

export default function AdminPlatformsPage() {
  const router = useRouter();
  const qc = useQueryClient();
  const confirm = useConfirm();
  const [name, setName] = useState('DwumaPOS');
  const [slug, setSlug] = useState('dwumapos');
  const [createdSecret, setCreatedSecret] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated() || !isAdmin()) router.push('/login');
  }, [router]);

  const { data: platforms = [], isLoading } = useQuery({
    queryKey: ['admin-platforms'],
    queryFn: async () => (await apiClient.get('/admin/platforms')).data as Platform[],
  });

  const { data: keys = [] } = useQuery({
    queryKey: ['admin-platform-keys', selectedId],
    enabled: Boolean(selectedId),
    queryFn: async () =>
      (await apiClient.get(`/admin/platforms/${selectedId}/api-keys`)).data as ApiKeyRow[],
  });

  const createPlatform = useMutation({
    mutationFn: async () =>
      (
        await apiClient.post('/admin/platforms', {
          name,
          slug,
          createLiveKey: true,
          releasePolicy: 'PLATFORM_RELEASE',
        })
      ).data as { platform: Platform; apiKey?: { secret: string; keyId: string } },
    onSuccess: (data) => {
      toast.success('Platform created');
      setSelectedId(data.platform.id);
      if (data.apiKey?.secret) setCreatedSecret(data.apiKey.secret);
      void qc.invalidateQueries({ queryKey: ['admin-platforms'] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Create failed'),
  });

  const createKey = useMutation({
    mutationFn: async () =>
      (
        await apiClient.post(`/admin/platforms/${selectedId}/api-keys`, {
          environment: 'LIVE',
          name: 'Dashboard key',
        })
      ).data as { secret: string; keyId: string },
    onSuccess: (data) => {
      setCreatedSecret(data.secret);
      toast.success('API key created — copy it now');
      void qc.invalidateQueries({ queryKey: ['admin-platform-keys', selectedId] });
    },
    onError: (e: any) => toast.error(e?.response?.data?.message || 'Key create failed'),
  });

  const revokeKey = useMutation({
    mutationFn: async (keyId: string) =>
      apiClient.post(`/admin/platforms/${selectedId}/api-keys/${keyId}/revoke`),
    onSuccess: () => {
      toast.success('Key revoked');
      void qc.invalidateQueries({ queryKey: ['admin-platform-keys', selectedId] });
    },
  });

  if (!isAuthenticated() || !isAdmin()) {
    return <PageSpinner />;
  }

  return (
    <Layout title="Partner platforms">
      <LightShell>
        <p className={dash.subtitle}>API keys for DwumaPOS and other commerce integrations</p>

        {createdSecret && (
          <LightPanel className="mb-4 border-amber-300 bg-amber-50">
            <p className="text-sm font-semibold text-amber-900">Copy this secret now — shown once</p>
            <code className="mt-2 block break-all rounded bg-white p-3 text-xs text-gray-900">
              {createdSecret}
            </code>
            <Button
              type="button"
              size="sm"
              variant="maroon"
              className="mt-3"
              onClick={() => {
                void navigator.clipboard.writeText(createdSecret);
                toast.success('Copied');
              }}
            >
              Copy secret
            </Button>
          </LightPanel>
        )}

        <div className="grid gap-4 lg:grid-cols-2">
          <LightPanel>
            <h2 className={`${dash.sectionTitle} mb-3`}>Create platform</h2>
            <div className="space-y-3">
              <Field tone="light" label="Name" htmlFor="platform-name">
                <Input
                  id="platform-name"
                  tone="light"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                />
              </Field>
              <Field tone="light" label="Slug" htmlFor="platform-slug">
                <Input
                  id="platform-slug"
                  tone="light"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value)}
                />
              </Field>
              <Button
                type="button"
                variant="maroon"
                onClick={() => createPlatform.mutate()}
                disabled={createPlatform.isPending}
                loading={createPlatform.isPending}
              >
                <Plus className="mr-1 h-4 w-4" />
                Create + live key
              </Button>
            </div>
          </LightPanel>

          <LightPanel>
            <h2 className={`${dash.sectionTitle} mb-3`}>Platforms</h2>
            {isLoading ? (
              <p className="text-sm text-gray-500">Loading…</p>
            ) : platforms.length === 0 ? (
              <EmptyState
                tone="light"
                icon={<Plus className="w-6 h-6" />}
                title="No platforms yet"
                description="Use Create + live key on the left to add the first partner."
                className="py-6"
              />
            ) : (
              <ul className="space-y-2">
                {platforms.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(p.id)}
                      className={`w-full rounded-[16px] min-h-[44px] px-3 py-2.5 text-left text-[17px] touch-manipulation ${
                        selectedId === p.id
                          ? 'bg-brand-maroon/5 text-gray-900'
                          : 'bg-transparent hover:bg-black/[0.03]'
                      }`}
                    >
                      <div className="font-semibold text-gray-900">{p.name}</div>
                      <div className="text-[13px] text-[rgba(60,60,67,0.6)]">
                        {p.slug} · {p.releasePolicy} · {p.isActive ? 'active' : 'inactive'}
                      </div>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </LightPanel>
        </div>

        {selectedId && (
          <TableShell
            tone="light"
            toolbar={
              <div className="flex items-center justify-between gap-3">
                <h2 className={dash.sectionTitle}>API keys</h2>
                <Button type="button" size="sm" variant="maroon" onClick={() => createKey.mutate()}>
                  <KeyRound className="h-4 w-4" />
                  New key
                </Button>
              </div>
            }
          >
            <Table>
              <TableHead>
                <tr>
                  <TableTh>Key</TableTh>
                  <TableTh>Type</TableTh>
                  <TableTh>Env</TableTh>
                  <TableTh>Status</TableTh>
                  <TableTh> </TableTh>
                </tr>
              </TableHead>
              <TableBody>
                {keys.length === 0 ? (
                  <TableEmpty colSpan={5}>
                    <EmptyState
                      tone="light"
                      icon={<KeyRound className="w-6 h-6" />}
                      title="No keys yet"
                      description="Create a live key with New key above."
                      className="py-6"
                    />
                  </TableEmpty>
                ) : (
                  keys.map((k) => (
                    <TableRow key={k.id}>
                      <TableTd className="font-mono text-[15px]">
                        {k.keyId}…{k.lastFour}
                      </TableTd>
                      <TableTd muted>{k.keyType}</TableTd>
                      <TableTd muted>{k.environment}</TableTd>
                      <TableTd muted>{k.revokedAt ? 'Revoked' : 'Active'}</TableTd>
                      <TableTd>
                        {!k.revokedAt && (
                          <button
                            type="button"
                            className="inline-flex min-h-[44px] min-w-[44px] items-center justify-center rounded-[16px] text-[#ff3b30] hover:bg-red-50 touch-manipulation"
                            onClick={async () => {
                              const ok = await confirm({
                                title: 'Revoke API key',
                                message: 'Revoke this key? Integrations using it will stop working immediately.',
                                confirmLabel: 'Revoke',
                                destructive: true,
                              });
                              if (ok) revokeKey.mutate(k.id);
                            }}
                            aria-label="Revoke key"
                          >
                            <Trash2 className="h-5 w-5" />
                          </button>
                        )}
                      </TableTd>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableShell>
        )}
      </LightShell>
    </Layout>
  );
}
