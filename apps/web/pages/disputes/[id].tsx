import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { isAuthenticated, isAdmin, getUser } from '@/lib/auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { formatDate } from '@/lib/utils';
import { MessageSquare, Send, CheckCircle, XCircle, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import DisputeSLATimer from '@/components/DisputeSLATimer';

interface Dispute {
  id: string;
  escrowId: string;
  status: string;
  reason: string;
  description: string;
  createdAt: string;
}

interface DisputeMessage {
  id: string;
  senderId: string;
  content: string;
  isSystem: boolean;
  createdAt: string;
}

export default function DisputeDetailPage() {
  const router = useRouter();
  const { id } = router.query;
  const queryClient = useQueryClient();
  const user = getUser();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    if (!isAuthenticated()) {
      router.push('/login');
    }
  }, [router]);

  const { data: dispute, isLoading } = useQuery<Dispute>({
    queryKey: ['dispute', id],
    queryFn: async () => {
      const response = await apiClient.get(`/disputes/${id}`);
      return response.data;
    },
    enabled: !!id,
  });

  const { data: messages, isLoading: messagesLoading } = useQuery<DisputeMessage[]>({
    queryKey: ['dispute-messages', id],
    queryFn: async () => {
      const response = await apiClient.get(`/disputes/${id}`);
      return response.data.messages || [];
    },
    enabled: !!id,
  });

  const { data: escrow } = useQuery({
    queryKey: ['escrow', dispute?.escrowId],
    queryFn: async () => {
      if (!dispute?.escrowId) return null;
      const response = await apiClient.get(`/escrows/${dispute.escrowId}`);
      return response.data;
    },
    enabled: !!dispute?.escrowId,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiClient.post(`/disputes/${id}/message`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispute-messages', id] });
      setMessage('');
      toast.success('Message sent');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to send message');
    },
  });

  const resolveMutation = useMutation({
    mutationFn: async (data: { outcome: string; notes?: string }) => {
      return apiClient.put(`/disputes/${id}/resolve`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispute', id] });
      queryClient.invalidateQueries({ queryKey: ['disputes'] });
      toast.success('Dispute resolved');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to resolve dispute');
    },
  });

  const closeMutation = useMutation({
    mutationFn: async () => {
      return apiClient.put(`/disputes/${id}/close`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispute', id] });
      queryClient.invalidateQueries({ queryKey: ['disputes'] });
      toast.success('Dispute closed');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to close dispute');
    },
  });

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;

    setSending(true);
    try {
      await sendMessageMutation.mutateAsync(message);
    } finally {
      setSending(false);
    }
  };

  const handleResolve = () => {
    const outcome = prompt('Enter resolution outcome:');
    if (outcome) {
      resolveMutation.mutate({ outcome });
    }
  };

  const handleClose = () => {
    if (confirm('Close this dispute?')) {
      closeMutation.mutate();
    }
  };

  if (!isAuthenticated()) {
    return null;
  }

  if (isLoading) {
    return (
      <Layout>
        <div className="space-y-6">
          <div className="h-8 bg-gray-200 animate-pulse rounded w-1/3" />
          <div className="h-64 bg-gray-200 animate-pulse rounded" />
        </div>
      </Layout>
    );
  }

  if (!dispute) {
    return (
      <Layout>
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 mx-auto text-gray-400 mb-4" />
          <p className="text-gray-600">Dispute not found</p>
        </div>
      </Layout>
    );
  }

  const statusColors: Record<string, string> = {
    OPEN: 'bg-yellow-100 text-yellow-800',
    RESOLVED: 'bg-green-100 text-green-800',
    CLOSED: 'bg-gray-100 text-gray-800',
  };

  const canSendMessage = dispute.status === 'OPEN';
  const isAdminUser = isAdmin();

  return (
    <Layout>
      <div className="space-y-6">
        <div>
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-gray-900 mb-4"
          >
            ← Back
          </button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Dispute Details</h1>
              <p className="text-gray-600 mt-1">ID: {dispute.id}</p>
            </div>
            <span
              className={`px-3 py-1 rounded-full text-sm font-medium ${
                statusColors[dispute.status] || 'bg-gray-100 text-gray-800'
              }`}
            >
              {dispute.status}
            </span>
          </div>
        </div>

        {/* SLA Timer */}
        {dispute && dispute.status === 'OPEN' && <DisputeSLATimer disputeId={dispute.id} />}

        {/* Dispute Info */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Dispute Information</h2>
          <div className="space-y-3">
            {escrow && (
              <div>
                <p className="text-sm text-gray-600">Escrow</p>
                <p className="font-medium text-gray-900">
                  {escrow.description || escrow.id}
                </p>
              </div>
            )}
            {dispute && (
              <>
                <div>
                  <p className="text-sm text-gray-600">Reason</p>
                  <p className="font-medium text-gray-900">
                    {dispute.reason.replace('_', ' ')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Description</p>
                  <p className="font-medium text-gray-900">{dispute.description}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Created</p>
                  <p className="font-medium text-gray-900">{formatDate(dispute.createdAt)}</p>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="bg-white rounded-lg shadow">
          <div className="p-6 border-b">
            <h2 className="text-xl font-semibold text-gray-900">Messages</h2>
          </div>
          <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
            {messagesLoading ? (
              <div className="space-y-4">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-20 bg-gray-200 animate-pulse rounded" />
                ))}
              </div>
            ) : messages && messages.length > 0 ? (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-4 rounded-lg ${
                    msg.senderId === user?.id
                      ? 'bg-blue-50 ml-8'
                      : msg.isSystem
                      ? 'bg-gray-50'
                      : 'bg-gray-50 mr-8'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-gray-900">
                      {msg.isSystem ? 'System' : msg.senderId === user?.id ? 'You' : 'Other Party'}
                    </span>
                    <span className="text-xs text-gray-500">{formatDate(msg.createdAt)}</span>
                  </div>
                  <p className="text-gray-700">{msg.content}</p>
                </div>
              ))
            ) : (
              <p className="text-center text-gray-500 py-8">No messages yet</p>
            )}
          </div>

          {/* Message Input */}
          {canSendMessage && (
            <div className="p-6 border-t">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  disabled={sending}
                />
                <button
                  type="submit"
                  disabled={sending || !message.trim()}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <Send className="w-4 h-4" />
                  )}
                  Send
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Admin Actions */}
        {isAdminUser && dispute && dispute.status === 'OPEN' && (
          <div className="bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-semibold text-gray-900 mb-4">Admin Actions</h2>
            <div className="flex gap-4">
              <button
                onClick={handleResolve}
                disabled={resolveMutation.isPending}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center gap-2"
              >
                <CheckCircle className="w-4 h-4" />
                {resolveMutation.isPending ? 'Resolving...' : 'Resolve Dispute'}
              </button>
              <button
                onClick={handleClose}
                disabled={closeMutation.isPending}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 flex items-center gap-2"
              >
                <XCircle className="w-4 h-4" />
                {closeMutation.isPending ? 'Closing...' : 'Close Dispute'}
              </button>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}

