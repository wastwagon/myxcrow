import { useCallback, useRef, useState } from 'react';
import { hapticSuccess } from '@/lib/haptics';

const PULL_THRESHOLD = 72;
const MAX_PULL = 120;

interface UsePullToRefreshOptions {
  onRefresh: () => void | Promise<void>;
  disabled?: boolean;
}

export function usePullToRefresh({ onRefresh, disabled }: UsePullToRefreshOptions) {
  const [pull, setPull] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const startY = useRef(0);
  const pulling = useRef(false);

  const canPull = useCallback(() => {
    if (disabled || refreshing) return false;
    if (typeof window === 'undefined') return false;
    const scroller = document.getElementById('customer-scroll');
    if (scroller) return scroller.scrollTop <= 0;
    return window.scrollY <= 0;
  }, [disabled, refreshing]);

  const onTouchStart = useCallback(
    (e: React.TouchEvent) => {
      if (!canPull()) return;
      startY.current = e.touches[0].clientY;
      pulling.current = true;
    },
    [canPull]
  );

  const onTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (!pulling.current || !canPull()) return;
      const delta = e.touches[0].clientY - startY.current;
      if (delta > 0) {
        setPull(Math.min(delta * 0.45, MAX_PULL));
      } else {
        setPull(0);
      }
    },
    [canPull]
  );

  const onTouchEnd = useCallback(async () => {
    if (!pulling.current) return;
    pulling.current = false;
    const shouldRefresh = pull >= PULL_THRESHOLD;
    setPull(0);
    if (!shouldRefresh) return;
    setRefreshing(true);
    try {
      await onRefresh();
      hapticSuccess();
    } finally {
      setRefreshing(false);
    }
  }, [onRefresh, pull]);

  return {
    pull,
    refreshing,
    pullHandlers: { onTouchStart, onTouchMove, onTouchEnd },
    pullProgress: Math.min(pull / PULL_THRESHOLD, 1),
  };
}
