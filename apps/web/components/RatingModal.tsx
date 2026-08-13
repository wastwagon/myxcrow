import { useState, useEffect } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import apiClient from '@/lib/api-client';
import { Star } from 'lucide-react';
import { toast } from 'react-hot-toast';
import { Sheet } from '@/components/ui/Sheet';
import { Button } from '@/components/ui/Button';

interface RatingModalProps {
  isOpen: boolean;
  onClose: () => void;
  escrowId: string;
  rateeId: string;
  rateeName: string;
  role: 'buyer' | 'seller';
}

export default function RatingModal({
  isOpen,
  onClose,
  escrowId,
  rateeId,
  rateeName,
  role,
}: RatingModalProps) {
  const [score, setScore] = useState(0);
  const [hoveredScore, setHoveredScore] = useState(0);
  const [comment, setComment] = useState('');
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!isOpen) {
      setScore(0);
      setHoveredScore(0);
      setComment('');
    }
  }, [isOpen]);

  const ratingMutation = useMutation({
    mutationFn: async (data: {
      escrowId: string;
      rateeId: string;
      role: 'buyer' | 'seller';
      score: number;
      comment?: string;
    }) => {
      return apiClient.post('/reputation/rate', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['escrow', escrowId] });
      queryClient.invalidateQueries({ queryKey: ['public-profile', rateeId] });
      toast.success('Rating submitted successfully');
      onClose();
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to submit rating');
    },
  });

  const handleSubmit = () => {
    if (score === 0) {
      toast.error('Please select a rating');
      return;
    }

    ratingMutation.mutate({
      escrowId,
      rateeId,
      role,
      score,
      comment: comment.trim() || undefined,
    });
  };

  return (
    <Sheet
      open={isOpen}
      onClose={onClose}
      title={`Rate ${rateeName}`}
      tone="light"
      footer={
        <div className="flex flex-col gap-2 pb-2">
          <Button
            fullWidth
            variant="maroon"
            onClick={handleSubmit}
            loading={ratingMutation.isPending}
            disabled={score === 0}
          >
            Submit rating
          </Button>
          <Button fullWidth variant="outline" onClick={onClose}>
            Cancel
          </Button>
        </div>
      }
    >
      <div className="space-y-5 pb-2">
        <div>
          <p className="text-[13px] text-[rgba(60,60,67,0.6)] mb-3">Tap a star (1–5)</p>
          <div className="flex items-center justify-center gap-3">
            {[1, 2, 3, 4, 5].map((star) => (
              <button
                key={star}
                type="button"
                onClick={() => setScore(star)}
                onMouseEnter={() => setHoveredScore(star)}
                onMouseLeave={() => setHoveredScore(0)}
                className="min-w-[48px] min-h-[48px] flex items-center justify-center touch-manipulation"
                aria-label={`${star} stars`}
              >
                <Star
                  className={`w-9 h-9 transition-colors ${
                    star <= (hoveredScore || score)
                      ? 'fill-brand-gold text-brand-gold'
                      : 'text-[#d1d1d6]'
                  }`}
                />
              </button>
            ))}
          </div>
        </div>

        <div>
          <label htmlFor="rating-comment" className="block text-[13px] text-[rgba(60,60,67,0.6)] mb-2">
            Comment (optional)
          </label>
          <textarea
            id="rating-comment"
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            rows={4}
            className="w-full px-4 py-3 rounded-[10px] bg-[#f2f2f7] border-0 text-gray-900 placeholder:text-[rgba(60,60,67,0.4)] focus:ring-2 focus:ring-brand-maroon/25 outline-none resize-none"
            placeholder="Share your experience..."
          />
        </div>
      </div>
    </Sheet>
  );
}
