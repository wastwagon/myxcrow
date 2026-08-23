import { useRouter } from 'next/router';
import { useQuery } from '@tanstack/react-query';
import { AdminGate } from '@/components/admin/AdminGate';
import { ChatThread } from '@/components/chat/ChatThread';
import { Button } from '@/components/ui/Button';
import { PageSpinner } from '@/components/LoadingSkeleton';
import apiClient from '@/lib/api-client';
import { toast } from 'react-hot-toast';

export default function AdminSupportThreadPage() {
  const router = useRouter();
  const id = typeof router.query.id === 'string' ? router.query.id : '';

  const { isLoading } = useQuery({
    queryKey: ['chat-messages', 'support', id],
    queryFn: async () => (await apiClient.get(`/chat/support/${id}/messages`)).data,
    enabled: !!id,
  });

  const closeThread = async () => {
    try {
      await apiClient.post(`/chat/support/${id}/close`);
      toast.success('Marked resolved');
      router.push('/admin/support');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Could not close');
    }
  };

  return (
    <AdminGate
      title="Support chat"
      trailing={
        <Button type="button" variant="outline" size="sm" onClick={closeThread}>
          Resolve
        </Button>
      }
    >
      {!id || isLoading ? (
        <PageSpinner />
      ) : (
        <ChatThread
          kind="support"
          threadId={id}
          emptyTitle="No messages"
          emptyBody="Reply to the customer below."
        />
      )}
    </AdminGate>
  );
}
