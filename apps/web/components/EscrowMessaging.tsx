import { ChatThread } from '@/components/chat/ChatThread';
import { isAdmin } from '@/lib/auth';
import { Button } from '@/components/ui/Button';
import apiClient from '@/lib/api-client';
import { toast } from 'react-hot-toast';
import { useState } from 'react';

export default function EscrowMessaging({
  escrowId,
  supportJoinedAt,
}: {
  escrowId: string;
  supportJoinedAt?: string | null;
}) {
  const staff = isAdmin();
  const [joined, setJoined] = useState(!!supportJoinedAt);

  const handleJoin = async () => {
    try {
      await apiClient.post(`/chat/escrows/${escrowId}/join`);
      setJoined(true);
      toast.success('You joined this conversation');
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Could not join');
    }
  };

  return (
    <ChatThread
      kind="escrow"
      threadId={escrowId}
      emptyTitle="No messages yet"
      emptyBody="Coordinate delivery, PIN, or delays here. This thread is kept as evidence."
      composerDisabled={staff && !joined}
      composerHint={staff && !joined ? 'Join to message the buyer and seller.' : undefined}
      header={
        staff && !joined ? (
          <div className="flex items-center justify-between gap-3 border-b border-[rgba(60,60,67,0.08)] px-4 py-3">
            <p className="text-[13px] text-[rgba(60,60,67,0.6)]">Support is not in this thread yet.</p>
            <Button type="button" variant="maroon" size="sm" onClick={handleJoin}>
              Join
            </Button>
          </div>
        ) : undefined
      }
    />
  );
}
