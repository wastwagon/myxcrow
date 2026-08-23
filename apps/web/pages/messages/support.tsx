import { useQuery } from '@tanstack/react-query';
import CustomerLayout from '@/components/CustomerLayout';
import { ChatThread } from '@/components/chat/ChatThread';
import { PageSpinner } from '@/components/LoadingSkeleton';
import { useRequireAuth } from '@/lib/hooks/useRequireAuth';
import apiClient from '@/lib/api-client';

type SupportPayload = {
  conversation: { id: string; status: string };
  messages: unknown[];
};

export default function SupportChatPage() {
  const authed = useRequireAuth();
  const { data, isLoading } = useQuery<SupportPayload>({
    queryKey: ['chat-support-mine'],
    queryFn: async () => (await apiClient.get('/chat/support')).data,
    enabled: authed,
  });

  if (!authed || isLoading || !data?.conversation) {
    return (
      <CustomerLayout title="Support" back>
        <PageSpinner />
      </CustomerLayout>
    );
  }

  return (
    <CustomerLayout title="Support" back>
      <div className="-mx-4 -mt-1 sm:mx-0">
        <ChatThread
          kind="support"
          threadId={data.conversation.id}
          emptyTitle="MYXCROW support"
          emptyBody="Ask about fees, an escrow, your wallet, or an account issue."
        />
      </div>
    </CustomerLayout>
  );
}
