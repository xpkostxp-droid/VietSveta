import { useEffect, useRef } from 'react';

/** Measures active answer time only; neither feedback nor a hidden tab counts. */
export function useUntimedAnswerClock() {
  const elapsed = useRef(0);
  const since = useRef<number | null>(null);
  const active = useRef(false);
  const pause = () => {
    if (since.current !== null) elapsed.current += Math.max(0, performance.now() - since.current);
    since.current = null;
  };
  useEffect(() => {
    const visibility = () => {
      if (document.hidden) pause();
      else if (active.current && since.current === null) since.current = performance.now();
    };
    document.addEventListener('visibilitychange', visibility);
    return () => document.removeEventListener('visibilitychange', visibility);
  }, []);
  return {
    begin() { elapsed.current = 0; active.current = true; since.current = document.hidden ? null : performance.now(); },
    finish() { pause(); active.current = false; return Math.round(elapsed.current); },
  };
}
