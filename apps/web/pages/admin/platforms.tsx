import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { isAuthenticated, isAdmin } from '@/lib/auth';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { KeyRound, Plus, Trash2, Building2 } from 'lucide-react';
import { toast } from 'react-hot-toast';
import PageHeader from '@/components/PageHeader';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { LightShell, LightPanel } from '@/components/dashboard/LightShell';

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

  return (
    <Layout>
      <LightShell>
        <PageHeader
          title="Partner platforms"
          subtitle="API keys for DwumaPOS and other commerce integrations"
          icon={<Building2 className="h-6 w-6" />}
        />

        {createdSecret && (
          <LightPanel className="mb-4 border-amber-300 bg-amber-50">
            <p className="text-sm font-semibold text-amber-900">Copy this secret now — shown once</p>
            <code className="mt-2 block break-all rounded bg-white p-3 text-xs text-gray-900">
              {createdSecret}
            </code>
            <Button
              type="button"
              size="sm"
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
            <h2 className="mb-3 text-sm font-semibold">Create platform</h2>
            <div className="space-y-3">
              <Input label="Name" value={name} onChange={(e) => setName(e.target.value)} />
              <Input label="Slug" value={slug} onChange={(e) => setSlug(e.target.value)} />
              <Button
                type="button"
                onClick={() => createPlatform.mutate()}
                disabled={createPlatform.isPending}
              >
                <Plus className="mr-1 h-4 w-4" />
                Create + live key
              </Button>
            </div>
          </LightPanel>

          <LightPanel>
            <h2 className="mb-3 text-sm font-semibold">Platforms</h2>
            {isLoading ? (
              <p className="text-sm text-gray-500">Loading…</p>
            ) : platforms.length === 0 ? (
              <p className="text-sm text-gray-500">No platforms yet.</p>
            ) : (
              <ul className="space-y-2">
                {platforms.map((p) => (
                  <li key={p.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(p.id)}
                      className={`w-full rounded-xl border px-3 py-2 text-left text-sm ${
                        selectedId === p.id
                          ? 'border-brand-maroon bg-brand-maroon/5'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="font-semibold">{p.name}</div>
                      <div className="text-xs text-gray-500">
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
          <LightPanel className="mt-4">
            <div className="mb-3 flex items-center justify-between">
              <h2 className="text-sm font-semibold">API keys</h2>
              <Button type="button" size="sm" onClick={() => createKey.mutate()}>
                <KeyRound className="mr-1 h-4 w-4" />
                New key
              </Button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead>
                  <tr className="border-b text-xs text-gray-500">
                    <th className="py-2">Key</th>
                    <th>Type</th>
                    <th>Env</th>
                    <th>Status</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {keys.map((k) => (
                    <tr key={k.id} className="border-b border-gray-100">
                      <td className="py-2 font-mono text-xs">
                        {k.keyId}…{k.lastFour}
                      </td>
                      <td>{k.keyType}</td>
                      <td>{k.environment}</td>
                      <td>{k.revokedAt ? 'revoked' : 'active'}</td>
                      <td>
                        {!k.revokedAt && (
                          <button
                            type="button"
                            className="text-red-600"
                            onClick={() => revokeKey.mutate(k.id)}
                            title="Revoke"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </LightPanel>
        )}
      </LightShell>
    </Layout>
  );
}
