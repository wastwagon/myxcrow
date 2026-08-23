import { useCallback, useEffect, useMemo, useRef, useState, type FormEvent, type ReactNode } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { ImagePlus, Send } from 'lucide-react';
import { toast } from 'react-hot-toast';
import apiClient from '@/lib/api-client';
import { getUser } from '@/lib/auth';
import { formatDate } from '@/lib/utils';
import { Button } from '@/components/ui/Button';
import { useChatSocket } from '@/components/chat/ChatProvider';
import { chatPersonName, type ChatKind, type ChatMessage } from '@/lib/chat-types';
import { form } from '@/lib/form-classes';
import { cn } from '@/lib/utils';

export function ChatThread({
  kind,
  threadId,
  emptyTitle = 'No messages yet',
  emptyBody = 'Start the conversation.',
  composerDisabled = false,
  composerHint,
  header,
}: {
  kind: ChatKind;
  threadId: string;
  emptyTitle?: string;
  emptyBody?: string;
  composerDisabled?: boolean;
  composerHint?: string;
  header?: ReactNode;
}) {
  const queryClient = useQueryClient();
  const socket = useChatSocket();
  const user = getUser();
  const [draft, setDraft] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [typingName, setTypingName] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);
  const typingTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const path =
    kind === 'escrow' ? `/chat/escrows/${threadId}/messages` : `/chat/support/${threadId}/messages`;
  const queryKey = ['chat-messages', kind, threadId] as const;

  const { data: messages = [], isLoading } = useQuery<ChatMessage[]>({
    queryKey,
    queryFn: async () => {
      const response = await apiClient.get(path);
      return Array.isArray(response.data) ? response.data : response.data?.messages || [];
    },
    enabled: !!threadId,
  });

  useEffect(() => {
    if (!socket || !threadId) return;
    const payload = { kind, id: threadId };
    socket.emit('chat:join', payload);
    const onMessage = (msg: ChatMessage) => {
      if (msg.kind !== kind || msg.threadId !== threadId) return;
      queryClient.setQueryData<ChatMessage[]>(queryKey, (prev) => {
        if (!prev) return [msg];
        if (prev.some((row) => row.id === msg.id)) return prev;
        return [...prev, msg];
      });
    };
    const onTyping = (event: { kind: ChatKind; threadId: string; userId: string; name: string; typing: boolean }) => {
      if (event.kind !== kind || event.threadId !== threadId || event.userId === user?.id) return;
      setTypingName(event.typing ? event.name : null);
    };
    socket.on('chat:message', onMessage);
    socket.on('chat:typing', onTyping);
    socket.emit('chat:read', payload);
    void apiClient.post(kind === 'escrow' ? `/chat/escrows/${threadId}/read` : `/chat/support/${threadId}/read`);
    return () => {
      socket.emit('chat:leave', payload);
      socket.off('chat:message', onMessage);
      socket.off('chat:typing', onTyping);
    };
  }, [socket, kind, threadId, queryClient, user?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length, typingName]);

  const sendMutation = useMutation({
    mutationFn: async () => {
      const fd = new FormData();
      if (draft.trim()) fd.append('content', draft.trim());
      if (file) fd.append('file', file);
      return apiClient.post(path, fd);
    },
    onSuccess: (response) => {
      const msg = response.data as ChatMessage;
      queryClient.setQueryData<ChatMessage[]>(queryKey, (prev) => {
        if (!prev) return [msg];
        if (prev.some((row) => row.id === msg.id)) return prev;
        return [...prev, msg];
      });
      setDraft('');
      setFile(null);
      void queryClient.invalidateQueries({ queryKey: ['chat-unread'] });
    },
    onError: (error: { response?: { data?: { message?: string } } }) => {
      toast.error(error.response?.data?.message || 'Could not send');
    },
  });

  const emitTyping = useCallback(
    (typing: boolean) => {
      socket?.emit('chat:typing', { kind, id: threadId, typing });
    },
    [socket, kind, threadId],
  );

  const onChangeDraft = (value: string) => {
    setDraft(value);
    emitTyping(true);
    if (typingTimer.current) clearTimeout(typingTimer.current);
    typingTimer.current = setTimeout(() => emitTyping(false), 1200);
  };

  const handleSend = (e: FormEvent) => {
    e.preventDefault();
    if ((!draft.trim() && !file) || sendMutation.isPending || composerDisabled) return;
    emitTyping(false);
    sendMutation.mutate();
  };

  const grouped = useMemo(() => messages, [messages]);

  return (
    <div className="flex min-h-[420px] flex-col overflow-hidden rounded-[20px] bg-white">
      {header}
      <div className="min-h-0 flex-1 space-y-3 overflow-y-auto px-4 py-4">
        {isLoading ? (
          <p className="py-12 text-center text-[15px] text-[rgba(60,60,67,0.55)]">Loading messages…</p>
        ) : grouped.length === 0 ? (
          <div className="py-12 text-center">
            <p className="text-[16px] font-semibold text-brand-maroon-deep">{emptyTitle}</p>
            <p className="mt-1 text-[14px] text-[rgba(60,60,67,0.55)]">{emptyBody}</p>
          </div>
        ) : (
          grouped.map((msg) => {
            if (msg.isSystem) {
              return (
                <p key={msg.id} className="px-4 py-1 text-center text-[12px] text-[rgba(60,60,67,0.5)]">
                  {msg.content}
                </p>
              );
            }
            const mine = msg.senderId === user?.id;
            return (
              <div key={msg.id} className={cn('flex', mine ? 'justify-end' : 'justify-start')}>
                <div
                  className={cn(
                    'max-w-[min(100%,320px)] rounded-[18px] px-3.5 py-2.5',
                    mine
                      ? 'bg-brand-maroon text-white'
                      : 'bg-[#f2f2f7] text-brand-maroon-deep',
                  )}
                >
                  {!mine && (
                    <p className="mb-0.5 text-[11px] font-semibold opacity-70">
                      {msg.isStaff ? 'MYXCROW' : chatPersonName(msg.sender)}
                    </p>
                  )}
                  {msg.attachment?.url && msg.attachment.mime.startsWith('image/') && (
                    <a href={msg.attachment.url} target="_blank" rel="noreferrer" className="mb-2 block">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={msg.attachment.url}
                        alt={msg.attachment.name}
                        className="max-h-48 w-full rounded-[12px] object-cover"
                      />
                    </a>
                  )}
                  {msg.attachment?.url && !msg.attachment.mime.startsWith('image/') && (
                    <a
                      href={msg.attachment.url}
                      target="_blank"
                      rel="noreferrer"
                      className={cn('mb-1 block text-[13px] underline', mine ? 'text-white' : 'text-brand-maroon')}
                    >
                      {msg.attachment.name}
                    </a>
                  )}
                  {msg.content ? <p className="whitespace-pre-wrap text-[15px] leading-snug">{msg.content}</p> : null}
                  <p className={cn('mt-1 text-[11px]', mine ? 'text-white/70' : 'text-[rgba(60,60,67,0.5)]')}>
                    {formatDate(msg.createdAt)}
                  </p>
                </div>
              </div>
            );
          })
        )}
        {typingName && (
          <p className="text-[12px] text-[rgba(60,60,67,0.5)]">{typingName} is typing…</p>
        )}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={handleSend} className="shrink-0 border-t border-[rgba(60,60,67,0.08)] p-3">
        {file && (
          <p className="mb-2 truncate text-[12px] text-[rgba(60,60,67,0.6)]">
            {file.name}{' '}
            <button type="button" className="text-brand-maroon" onClick={() => setFile(null)}>
              Remove
            </button>
          </p>
        )}
        {composerHint && (
          <p className="mb-2 text-[12px] text-[rgba(60,60,67,0.55)]">{composerHint}</p>
        )}
        <div className="flex items-end gap-2">
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif,application/pdf"
            className="hidden"
            onChange={(e) => setFile(e.target.files?.[0] || null)}
          />
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={composerDisabled}
            className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-[14px] bg-[#f2f2f7] text-brand-maroon-deep touch-manipulation"
            aria-label="Attach photo"
          >
            <ImagePlus className="h-5 w-5" />
          </button>
          <input
            value={draft}
            onChange={(e) => onChangeDraft(e.target.value)}
            placeholder="Message"
            className={`flex-1 ${form.input}`}
            disabled={composerDisabled || sendMutation.isPending}
          />
          <Button
            type="submit"
            variant="maroon"
            disabled={composerDisabled || sendMutation.isPending || (!draft.trim() && !file)}
            loading={sendMutation.isPending}
            aria-label="Send"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
