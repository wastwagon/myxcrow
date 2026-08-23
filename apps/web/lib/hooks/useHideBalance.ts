import { useCallback, useEffect, useState } from 'react';

const HIDE_BALANCE_KEY = 'mx_hide_balance';

/** Persisted hide-balance preference (avoids flash by gating wallet card on `ready`). */
export function useHideBalance() {
  const [hidden, setHidden] = useState(false);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    setHidden(window.localStorage.getItem(HIDE_BALANCE_KEY) === '1');
    setReady(true);
  }, []);

  const toggle = useCallback(() => {
    setHidden((prev) => {
      const next = !prev;
      window.localStorage.setItem(HIDE_BALANCE_KEY, next ? '1' : '0');
      return next;
    });
  }, []);

  return { hidden, toggle, ready };
}
