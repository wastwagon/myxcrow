import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Headphones, MessageCircle, Shield } from 'lucide-react';
import CustomerLayout from '@/components/CustomerLayout';
import { CustomerShellChrome, SHELL_CONTENT_CLASS } from '@/components/home/CustomerShellChrome';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { ListGroup, ListRow } from '@/components/ui/ListGroup';
import { IconWell } from '@/components/ui/IconWell';
import { EmptyState } from '@/components/ui/EmptyState';
import { FilterCards } from '@/components/ui/FilterCards';
import { ListRowsSkeleton, PageSpinner } from '@/components/LoadingSkeleton';
import { useIsMobileNav } from '@/lib/hooks/useMediaQuery';
import { useRequireAuth } from '@/lib/hooks/useRequireAuth';
import apiClient from '@/lib/api-client';
import { formatTimeAgo } from '@/lib/utils';
import type { ChatThreadSummary } from '@/lib/chat-types';
import { useState } from 'react';

type InboxFilter = 'all' | 'escrow' | 'support';

export default function MessagesInboxPage() {
  const authed = useRequireAuth();
  const isMobile = useIsMobileNav();
  const queryClient = useQueryClient();
  const [filter, setFilter] = useState<InboxFilter>('all');

  const { data = [], isLoading } = useQuery<ChatThreadSummary[]>({
    queryKey: ['chat-inbox'],
    queryFn: async () => (await apiClient.get('/chat/inbox')).data,
    enabled: authed,
  });

  if (!authed) return <PageSpinner />;

  const visible = data.filter((row) => (filter === 'all' ? true : row.kind === filter));

  return (
    <CustomerLayout title="Messages" variant="home">
      <PullToRefresh
        onRefresh={() => queryClient.invalidateQueries({ queryKey: ['chat-inbox'] })}
        disabled={!isMobile}
      >
        <CustomerShellChrome screenTitle="Messages" />
        <div className={SHELL_CONTENT_CLASS}>
          <FilterCards
            value={filter}
            onChange={setFilter}
            columns={3}
            options={[
              { value: 'all', label: 'All', subtitle: 'Inbox', icon: MessageCircle, color: 'maroon', count: data.reduce((n, r) => n + r.unreadCount, 0) },
              { value: 'escrow', label: 'Deals', subtitle: 'Buyer / seller', icon: Shield, color: 'teal', count: data.filter((r) => r.kind === 'escrow').reduce((n, r) => n + r.unreadCount, 0) },
              { value: 'support', label: 'Support', subtitle: 'MYXCROW', icon: Headphones, color: 'indigo', count: data.filter((r) => r.kind === 'support').reduce((n, r) => n + r.unreadCount, 0) },
            ]}
          />

          {isLoading ? (
            <ListRowsSkeleton rows={4} />
          ) : visible.length === 0 ? (
            <EmptyState
              title={filter === 'support' ? 'No support chats yet' : 'No messages yet'}
              description="Deal chats appear here when you message a buyer or seller. Tap Support to reach MYXCROW."
              action={{ href: '/messages/support', label: 'Chat with support' }}
            />
          ) : (
            <ListGroup tone="light">
              {visible.map((row) => (
                <ListRow
                  key={`${row.kind}-${row.id}`}
                  href={row.href}
                  leading={
                    <IconWell
                      icon={row.kind === 'support' ? Headphones : Shield}
                      color={row.kind === 'support' ? 'indigo' : 'maroon'}
                    />
                  }
                  title={row.title}
                  subtitle={`${row.lastMessage || row.subtitle} · ${row.lastMessageAt ? formatTimeAgo(row.lastMessageAt) : ''}`}
                  trailing={
                    row.unreadCount > 0 ? (
                      <span className="min-w-[20px] rounded-full bg-[#ff3b30] px-1.5 text-center text-[11px] font-semibold leading-5 text-white">
                        {row.unreadCount > 9 ? '9+' : row.unreadCount}
                      </span>
                    ) : undefined
                  }
                />
              ))}
            </ListGroup>
          )}
        </div>
      </PullToRefresh>
    </CustomerLayout>
  );
}
