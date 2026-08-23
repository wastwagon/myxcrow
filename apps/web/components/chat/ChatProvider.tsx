import { createContext, useContext, useEffect, type ReactNode } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import type { Socket } from 'socket.io-client';
import apiClient from '@/lib/api-client';
import { getChatSocket, disconnectChatSocket } from '@/lib/chat-socket';
import { isAuthenticated } from '@/lib/auth';
import type { ChatUnread } from '@/lib/chat-types';

const ChatSocketContext = createContext<Socket | null>(null);

export function ChatProvider({ children }: { children: ReactNode }) {
  const queryClient = useQueryClient();
  const authed = typeof window !== 'undefined' && isAuthenticated();

  useEffect(() => {
    if (!authed) {
      disconnectChatSocket();
      return;
    }
    const socket = getChatSocket();
    const bumpUnread = () => {
      void queryClient.invalidateQueries({ queryKey: ['chat-unread'] });
      void queryClient.invalidateQueries({ queryKey: ['chat-inbox'] });
      void queryClient.invalidateQueries({ queryKey: ['chat-admin-inbox'] });
    };
    const onMessage = (payload: { kind?: string; threadId?: string }) => {
      if (payload?.kind && payload?.threadId) {
        void queryClient.invalidateQueries({ queryKey: ['chat-messages', payload.kind, payload.threadId] });
      }
      bumpUnread();
    };
    socket.on('chat:message', onMessage);
    socket.on('chat:unread', bumpUnread);
    if (!socket.connected) socket.connect();
    return () => {
      socket.off('chat:message', onMessage);
      socket.off('chat:unread', bumpUnread);
    };
  }, [authed, queryClient]);

  return (
    <ChatSocketContext.Provider value={authed ? getChatSocket() : null}>
      {children}
    </ChatSocketContext.Provider>
  );
}

export function useChatSocket() {
  return useContext(ChatSocketContext);
}

export function useChatUnread() {
  const authed = typeof window !== 'undefined' && isAuthenticated();
  const { data } = useQuery<ChatUnread>({
    queryKey: ['chat-unread'],
    queryFn: async () => (await apiClient.get('/chat/unread')).data,
    enabled: authed,
    staleTime: 15_000,
  });
  return data ?? { escrow: 0, support: 0, total: 0 };
}
