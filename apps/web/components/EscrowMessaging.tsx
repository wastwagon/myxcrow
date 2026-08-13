import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { formatDate } from '@/lib/utils';
import { Send, MessageSquare, User } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getUser } from '@/lib/auth';
import { form } from '@/lib/form-classes';
import { Button } from '@/components/ui/Button';

interface EscrowMessage {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
  escrow?: {
    buyer?: { id: string; email: string; firstName?: string; lastName?: string };
    seller?: { id: string; email: string; firstName?: string; lastName?: string };
  };
}

interface EscrowMessagingProps {
  escrowId: string;
}

export default function EscrowMessaging({ escrowId }: EscrowMessagingProps) {
  const [message, setMessage] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const user = getUser();
  const queryClient = useQueryClient();

  const { data: messages, isLoading } = useQuery<EscrowMessage[]>({
    queryKey: ['escrow-messages', escrowId],
    queryFn: async () => {
      const response = await apiClient.get(`/escrows/${escrowId}/messages`);
      return response.data;
    },
    enabled: !!escrowId,
    refetchInterval: 5000,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => apiClient.post(`/escrows/${escrowId}/messages`, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escrow-messages', escrowId] });
      setMessage('');
      toast.success('Message sent');
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Failed to send message');
    },
  });

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim() || sending) return;
    setSending(true);
    try {
      await sendMessageMutation.mutateAsync(message);
    } finally {
      setSending(false);
    }
  };

  const getSenderName = (msg: EscrowMessage) => {
    if (!msg.escrow) return 'Unknown';
    const isBuyer = msg.escrow.buyer?.id === msg.userId;
    const person = isBuyer ? msg.escrow.buyer : msg.escrow.seller;
    return person?.firstName && person?.lastName
      ? `${person.firstName} ${person.lastName}`
      : person?.email || 'Unknown';
  };

  const isOwnMessage = (msg: EscrowMessage) => msg.userId === user?.id;

  const header = (
    <div className="flex items-center gap-2 mb-4">
      <MessageSquare className="w-5 h-5 text-brand-gold" />
      <h3 className="text-ios-headline font-semibold text-label-primary">Messages</h3>
    </div>
  );

  if (isLoading) {
    return (
      <div className={form.panel}>
        {header}
        <div className="text-center py-8 text-label-tertiary">Loading messages…</div>
      </div>
    );
  }

  return (
    <div className={form.panel}>
      {header}

      <div className="border border-[var(--separator)] rounded-[12px] h-96 overflow-y-auto p-4 mb-4 space-y-4 bg-[var(--form-input-bg)]">
        {messages && messages.length > 0 ? (
          messages.map((msg) => (
            <div key={msg.id} className={`flex ${isOwnMessage(msg) ? 'justify-end' : 'justify-start'}`}>
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-[12px] ${
                  isOwnMessage(msg)
                    ? 'bg-brand-maroon/10 text-[var(--form-input-text)] border border-brand-maroon/20'
                    : 'bg-[var(--form-panel-bg)] text-[var(--form-input-text)] border border-[var(--separator)]'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <User className="w-3 h-3 opacity-70" />
                  <span className="text-ios-caption font-medium text-label-secondary">
                    {isOwnMessage(msg) ? 'You' : getSenderName(msg)}
                  </span>
                </div>
                <p className="text-ios-subhead whitespace-pre-wrap">{msg.content}</p>
                <p className="text-ios-caption mt-1 text-label-tertiary">{formatDate(msg.createdAt)}</p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-label-tertiary">No messages yet. Start the conversation!</div>
        )}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={handleSend} className="flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type your message…"
          className={`flex-1 ${form.input}`}
          disabled={sending}
        />
        <Button type="submit" variant="maroon" disabled={!message.trim() || sending} loading={sending}>
          <Send className="w-4 h-4" />
          Send
        </Button>
      </form>
    </div>
  );
}
