import { useEffect, useState } from 'react';
import { useRouter } from 'next/router';
import Layout from '@/components/Layout';
import { isAuthenticated, isAdmin, getUser } from '@/lib/auth';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { formatDate } from '@/lib/utils';
import { Send, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { toast } from 'react-hot-toast';
import DisputeSLATimer from '@/components/DisputeSLATimer';
import { useConfirm } from '@/components/providers/UIProvider';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select } from '@/components/ui/Select';
import { Textarea } from '@/components/ui/Textarea';
import { Field } from '@/components/ui/Field';
import PageHeader from '@/components/PageHeader';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { StatusBadge } from '@/components/StatusBadge';
import { useIsMobileNav } from '@/lib/hooks/useMediaQuery';
import { ListRowsSkeleton, PageDetailSkeleton } from '@/components/LoadingSkeleton';

interface Dispute {
  id: string;
  escrowId: string;
  status: string;
  reason: string;
  description: string;
  resolution?: string;
  resolutionOutcome?: 'RELEASE_TO_SELLER' | 'REFUND_TO_BUYER';
  resolvedAt?: string;
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
  const confirm = useConfirm();
  const { id } = router.query;
  const queryClient = useQueryClient();
  const user = getUser();
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const isMobile = useIsMobileNav();

  const refreshDispute = async () => {
    await queryClient.invalidateQueries({ queryKey: ['dispute', id] });
    await queryClient.invalidateQueries({ queryKey: ['dispute-messages', id] });
    const cached = queryClient.getQueryData<{ escrowId?: string }>(['dispute', id]);
    if (cached?.escrowId) {
      await queryClient.invalidateQueries({ queryKey: ['escrow', cached.escrowId] });
    }
  };

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
    mutationFn: async (data: { resolution: string; outcome: 'RELEASE_TO_SELLER' | 'REFUND_TO_BUYER' }) => {
      return apiClient.put(`/disputes/${id}/resolve`, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispute', id] });
      queryClient.invalidateQueries({ queryKey: ['disputes'] });
      queryClient.invalidateQueries({ queryKey: ['escrow', dispute?.escrowId] });
      toast.success('Dispute resolved and funds applied');
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

  const handleResolve = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const resolution = (form.elements.namedItem('resolution') as HTMLTextAreaElement)?.value?.trim() ?? '';
    const outcome = (form.elements.namedItem('outcome') as HTMLSelectElement)?.value as 'RELEASE_TO_SELLER' | 'REFUND_TO_BUYER';
    if (!outcome || !['RELEASE_TO_SELLER', 'REFUND_TO_BUYER'].includes(outcome)) {
      toast.error('Select an outcome: Release to seller or Refund to buyer');
      return;
    }
    resolveMutation.mutate({ resolution, outcome });
  };

  const handleClose = async () => {
    const ok = await confirm({
      title: 'Close dispute',
      message: 'Close this dispute? You can reopen it later if needed.',
      confirmLabel: 'Close',
    });
    if (ok) closeMutation.mutate();
  };

  if (!isAuthenticated()) {
    return null;
  }

  if (isLoading) {
    return (
      <Layout>
        <PageDetailSkeleton />
      </Layout>
    );
  }

  if (!dispute) {
    return (
      <Layout>
        <div className="text-center py-12">
          <AlertCircle className="w-12 h-12 mx-auto text-label-tertiary mb-4" />
          <p className="text-label-secondary">Dispute not found</p>
        </div>
      </Layout>
    );
  }

  const canSendMessage = dispute.status === 'OPEN';
  const isAdminUser = isAdmin();

  return (
    <Layout>
      <PullToRefresh onRefresh={refreshDispute} disabled={!isMobile} className="mx-auto max-w-6xl space-y-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="text-sm font-medium text-white/60 hover:text-white transition-colors"
        >
          ← Back
        </button>
        <PageHeader
          eyebrow="Resolution"
          title="Dispute details"
          subtitle={`ID: ${dispute.id}`}
          icon={<AlertCircle className="w-6 h-6" />}
          action={<StatusBadge status={dispute.status} />}
        />

        {/* SLA Timer */}
        {dispute && dispute.status === 'OPEN' && <DisputeSLATimer disputeId={dispute.id} />}

        {/* Dispute Info */}
        <div className="rounded-ios-xl border border-white/10 bg-white/[0.07] backdrop-blur-sm shadow-ios-card p-6">
          <h2 className="text-xl font-semibold text-label-primary mb-4">Dispute Information</h2>
          <div className="space-y-3">
            {escrow && (
              <div>
                <p className="text-sm text-label-secondary">Escrow</p>
                <p className="font-medium text-label-primary">
                  {escrow.description || escrow.id}
                </p>
              </div>
            )}
            {dispute && (
              <>
                <div>
                  <p className="text-sm text-label-secondary">Reason</p>
                  <p className="font-medium text-label-primary">
                    {dispute.reason.replace('_', ' ')}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-label-secondary">Description</p>
                  <p className="font-medium text-label-primary">{dispute.description}</p>
                </div>
                <div>
                  <p className="text-sm text-label-secondary">Created</p>
                  <p className="font-medium text-label-primary">{formatDate(dispute.createdAt)}</p>
                </div>
                {dispute.status === 'RESOLVED' && (
                  <>
                    {dispute.resolutionOutcome && (
                      <div>
                        <p className="text-sm text-label-secondary">Outcome</p>
                        <p className="font-medium text-emerald-400">
                          {dispute.resolutionOutcome === 'RELEASE_TO_SELLER'
                            ? 'Released to seller'
                            : 'Refunded to buyer'}
                        </p>
                      </div>
                    )}
                    {dispute.resolution && (
                      <div>
                        <p className="text-sm text-label-secondary">Resolution notes</p>
                        <p className="font-medium text-label-primary">{dispute.resolution}</p>
                      </div>
                    )}
                    {dispute.resolvedAt && (
                      <div>
                        <p className="text-sm text-label-secondary">Resolved at</p>
                        <p className="font-medium text-label-primary">{formatDate(dispute.resolvedAt)}</p>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </div>
        </div>

        {/* Messages */}
        <div className="rounded-ios-xl border border-white/10 bg-white/[0.07] backdrop-blur-sm shadow-ios-card overflow-hidden">
          <div className="p-6 border-b border-white/10">
            <h2 className="text-xl font-semibold text-label-primary">Messages</h2>
          </div>
          <div className="p-6 space-y-4 max-h-96 overflow-y-auto">
            {messagesLoading ? (
              <ListRowsSkeleton rows={3} rowClassName="h-20" />
            ) : messages && messages.length > 0 ? (
              messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`p-4 rounded-lg ${
                    msg.senderId === user?.id
                      ? 'bg-brand-gold/15 ml-8 border border-brand-gold/25'
                      : msg.isSystem
                      ? 'bg-white/10'
                      : 'bg-white/10 mr-8 border border-white/10'
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-label-primary">
                      {msg.isSystem ? 'System' : msg.senderId === user?.id ? 'You' : 'Other Party'}
                    </span>
                    <span className="text-xs text-label-tertiary">{formatDate(msg.createdAt)}</span>
                  </div>
                  <p className="text-label-secondary">{msg.content}</p>
                </div>
              ))
            ) : (
              <p className="text-center text-label-tertiary py-8">No messages yet</p>
            )}
          </div>

          {/* Message Input */}
          {canSendMessage && (
            <div className="p-6 border-t border-white/10">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input
                  type="text"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1"
                  disabled={sending}
                />
                <Button type="submit" disabled={sending || !message.trim()} loading={sending}>
                  <Send className="w-4 h-4" />
                  Send
                </Button>
              </form>
            </div>
          )}
        </div>

        {/* Admin Actions */}
        {isAdminUser && dispute && ['OPEN', 'NEGOTIATION', 'MEDIATION', 'ARBITRATION'].includes(dispute.status) && (
          <div className="rounded-ios-xl border border-white/10 bg-white/[0.07] backdrop-blur-sm shadow-ios-card p-6">
            <h2 className="text-xl font-semibold text-label-primary mb-4">Admin Actions</h2>
            <form onSubmit={handleResolve} className="space-y-4">
              <Field
                label="Resolution outcome"
                htmlFor="outcome"
                required
                hint="Release pays the seller; Refund returns funds to the buyer."
              >
                <Select id="outcome" name="outcome" required className="max-w-md">
                  <option value="">Select outcome</option>
                  <option value="RELEASE_TO_SELLER">Release to seller</option>
                  <option value="REFUND_TO_BUYER">Refund to buyer</option>
                </Select>
              </Field>
              <Field label="Resolution notes" htmlFor="resolution">
                <Textarea
                  id="resolution"
                  name="resolution"
                  rows={3}
                  placeholder="Brief notes on the resolution decision..."
                />
              </Field>
              <div className="flex flex-wrap gap-3">
                <Button
                  type="submit"
                  variant="filled"
                  loading={resolveMutation.isPending}
                  className="bg-emerald-600 hover:bg-emerald-700 text-white"
                >
                  <CheckCircle className="w-4 h-4" />
                  Resolve & apply funds
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  onClick={handleClose}
                  loading={closeMutation.isPending}
                >
                  <XCircle className="w-4 h-4" />
                  Close only (no funds)
                </Button>
              </div>
            </form>
          </div>
        )}
      </PullToRefresh>
    </Layout>
  );
}

