import { useEffect } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { isAuthenticated } from '@/lib/auth';
import { useQuery } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { formatDateShort } from '@/lib/utils';
import { AlertCircle, Search } from 'lucide-react';
import Link from 'next/link';
import PageHeader from '@/components/PageHeader';

interface Dispute {
  id: string;
  escrowId: string;
  status: string;
  reason: string;
  description: string;
  createdAt: string;
}

export default function DisputesPage() {
  const router = useRouter();

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
    }
  }, [router]);

  const { data: disputes, isLoading } = useQuery<Dispute[]>({
    queryKey: ['disputes'],
    queryFn: async () => {
      const response = await apiClient.get('/disputes');
      return response.data;
    },
  });

  if (!isAuthenticated()) {
    return null;
  }

  const statusColors: Record<string, string> = {
    OPEN: 'bg-yellow-100 text-yellow-800',
    RESOLVED: 'bg-green-100 text-green-800',
    CLOSED: 'bg-gray-100 text-gray-800',
  };

  return (
    <Layout>
      <div className="space-y-6">
        <PageHeader
          title="Disputes"
          subtitle="View and manage disputes"
          icon={<AlertCircle className="w-6 h-6 text-white" />}
          gradient="red"
        />

        <div className="bg-white rounded-lg shadow">
          {isLoading ? (
            <div className="p-6 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-24 bg-gray-200 animate-pulse rounded" />
              ))}
            </div>
          ) : disputes && disputes.length > 0 ? (
            <div className="divide-y">
              {disputes.map((dispute) => (
                <Link
                  key={dispute.id}
                  href={`/disputes/${dispute.id}`}
                  className="block p-6 hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <AlertCircle className="w-5 h-5 text-red-600" />
                        <h3 className="font-semibold text-gray-900">
                          Dispute: {dispute.reason.replace('_', ' ')}
                        </h3>
                        <span
                          className={`px-2 py-1 text-xs font-medium rounded ${
                            statusColors[dispute.status] || 'bg-gray-100 text-gray-800'
                          }`}
                        >
                          {dispute.status}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 mb-2">{dispute.description}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <span>Escrow: {dispute.escrowId.slice(0, 8)}...</span>
                        <span>•</span>
                        <span>{formatDateShort(dispute.createdAt)}</span>
                      </div>
                    </div>
                    <div className="text-gray-400">→</div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-12 text-center text-gray-500">
              <AlertCircle className="w-12 h-12 mx-auto mb-3 text-gray-400" />
              <p className="text-lg mb-2">No disputes found</p>
              <p className="text-sm">Disputes will appear here when created</p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}

