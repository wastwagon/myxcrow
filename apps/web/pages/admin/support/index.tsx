import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Headphones } from 'lucide-react';
import { AdminGate } from '@/components/admin/AdminGate';
import { FilterCards } from '@/components/ui/FilterCards';
import { ListGroup, ListRow } from '@/components/ui/ListGroup';
import { IconWell } from '@/components/ui/IconWell';
import { EmptyState } from '@/components/ui/EmptyState';
import { ListRowsSkeleton } from '@/components/LoadingSkeleton';
import { PullToRefresh } from '@/components/ui/PullToRefresh';
import { useIsMobileNav } from '@/lib/hooks/useMediaQuery';
import apiClient from '@/lib/api-client';
import { formatTimeAgo } from '@/lib/utils';
import type { ChatThreadSummary } from '@/lib/chat-types';

type StatusFilter = 'OPEN' | 'CLOSED' | 'ALL';

export default function AdminSupportInboxPage() {
  const queryClient = useQueryClient();
  const isMobile = useIsMobileNav();
  const [status, setStatus] = useState<StatusFilter>('OPEN');

  const { data = [], isLoading } = useQuery<ChatThreadSummary[]>({
    queryKey: ['chat-admin-inbox', status],
    queryFn: async () => (await apiClient.get(`/chat/admin/support?status=${status}`)).data,
  });

  return (
    <AdminGate title="Live support">
      <PullToRefresh
        onRefresh={() => queryClient.invalidateQueries({ queryKey: ['chat-admin-inbox'] })}
        disabled={!isMobile}
      >
        <div className="space-y-4">
          <FilterCards
            value={status}
            onChange={setStatus}
            columns={3}
            options={[
              { value: 'OPEN', label: 'Open', subtitle: 'Waiting', icon: Headphones, color: 'maroon' },
              { value: 'CLOSED', label: 'Resolved', subtitle: 'Closed', icon: Headphones, color: 'gray' },
              { value: 'ALL', label: 'All', subtitle: 'History', icon: Headphones, color: 'indigo' },
            ]}
          />
          {isLoading ? (
            <ListRowsSkeleton rows={4} />
          ) : data.length === 0 ? (
            <EmptyState title="No conversations" description="When a user starts live chat, it will appear here." />
          ) : (
            <ListGroup tone="light">
              {data.map((row) => (
                <ListRow
                  key={row.id}
                  href={row.href}
                  leading={<IconWell icon={Headphones} color="maroon" />}
                  title={row.title}
                  subtitle={`${row.lastMessage} · ${row.lastMessageAt ? formatTimeAgo(row.lastMessageAt) : ''}`}
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
    </AdminGate>
  );
}
