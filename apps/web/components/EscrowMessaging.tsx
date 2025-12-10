import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { formatDate } from '@/lib/utils';
import { Send, MessageSquare, User } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { getUser } from '@/lib/auth';

interface EscrowMessage {
  id: string;
  userId: string;
  content: string;
  createdAt: string;
  escrow?: {
    buyer?: {
      id: string;
      email: string;
      firstName?: string;
      lastName?: string;
    };
    seller?: {
      id: string;
      email: string;
      firstName?: string;
      lastName?: string;
    };
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

  const { data: messages, isLoading } = useQuery<EscrowMessage[]>({
    queryKey: ['escrow-messages', escrowId],
    queryFn: async () => {
      const response = await apiClient.get(`/escrows/${escrowId}/messages`);
      return response.data;
    },
    enabled: !!escrowId,
    refetchInterval: 5000, // Poll every 5 seconds for new messages
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiClient.post(`/escrows/${escrowId}/messages`, { content });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escrow-messages', escrowId] });
      setMessage('');
      toast.success('Message sent');
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to send message');
    },
  });

  const queryClient = useQueryClient();

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

  const getSenderName = (message: EscrowMessage) => {
    if (!message.escrow) return 'Unknown';
    const isBuyer = message.escrow.buyer?.id === message.userId;
    const person = isBuyer ? message.escrow.buyer : message.escrow.seller;
    return person?.firstName && person?.lastName
      ? `${person.firstName} ${person.lastName}`
      : person?.email || 'Unknown';
  };

  const isOwnMessage = (message: EscrowMessage) => {
    return message.userId === user?.id;
  };

  if (isLoading) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center gap-2 mb-4">
          <MessageSquare className="w-5 h-5 text-gray-600" />
          <h3 className="text-lg font-semibold text-gray-900">Messages</h3>
        </div>
        <div className="text-center py-8 text-gray-500">Loading messages...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-2 mb-4">
        <MessageSquare className="w-5 h-5 text-gray-600" />
        <h3 className="text-lg font-semibold text-gray-900">Messages</h3>
      </div>

      {/* Messages List */}
      <div className="border border-gray-200 rounded-lg h-96 overflow-y-auto p-4 mb-4 space-y-4">
        {messages && messages.length > 0 ? (
          messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex ${isOwnMessage(msg) ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                  isOwnMessage(msg)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-900'
                }`}
              >
                <div className="flex items-center gap-2 mb-1">
                  <User className="w-3 h-3" />
                  <span className="text-xs font-medium opacity-75">
                    {isOwnMessage(msg) ? 'You' : getSenderName(msg)}
                  </span>
                </div>
                <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                <p className={`text-xs mt-1 ${isOwnMessage(msg) ? 'text-blue-100' : 'text-gray-500'}`}>
                  {formatDate(msg.createdAt)}
                </p>
              </div>
            </div>
          ))
        ) : (
          <div className="text-center py-8 text-gray-500">
            No messages yet. Start the conversation!
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <form onSubmit={handleSend} className="flex gap-2">
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
          disabled={!message.trim() || sending}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Send className="w-4 h-4" />
          {sending ? 'Sending...' : 'Send'}
        </button>
      </form>
    </div>
  );
}




