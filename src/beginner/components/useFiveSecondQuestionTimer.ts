import { useEffect, useRef, useState } from 'react';
import { makeGameSound } from './gameSounds';

/** The standard five-second question clock, with explicit resume after hiding. */
export function useFiveSecondQuestionTimer(onTimeout: () => void, onPause: () => void) {
  const [remaining, setRemaining] = useState(5000);
  const [paused, setPaused] = useState(false);
  const [running, setRunning] = useState(false);
  const active = useRef(false);
  const pausedRef = useRef(false);
  const elapsed = useRef(0);
  const since = useRef<number | null>(null);
  const lastBeep = useRef<number | null>(null);
  const audio = useRef(makeGameSound());
  const timeout = useRef(onTimeout); timeout.current = onTimeout;
  const pauseAction = useRef(onPause); pauseAction.current = onPause;
  const time = () => Math.min(5000, elapsed.current + (since.current === null ? 0 : Math.max(0, performance.now() - since.current)));
  useEffect(() => {
    const hide = () => {
      if (document.hidden && active.current && !pausedRef.current) {
        elapsed.current = time(); since.current = null;
        pausedRef.current = true; setPaused(true); pauseAction.current();
      }
    };
    document.addEventListener('visibilitychange', hide);
    return () => { document.removeEventListener('visibilitychange', hide); audio.current.close(); };
  }, []);
  useEffect(() => {
    if (!running) return;
    const interval = setInterval(() => {
      if (!active.current || pausedRef.current) return;
      const left = 5000 - time(); setRemaining(left);
      const digit = Math.ceil(left / 1000);
      if (digit >= 1 && digit <= 3 && lastBeep.current !== digit) { lastBeep.current = digit; audio.current.beep(digit); }
      if (left === 0) timeout.current();
    }, 40);
    return () => clearInterval(interval);
  }, [running]);
  return {
    remaining, paused,
    isPaused: () => pausedRef.current,
    ready() { audio.current.ready(); },
    begin() {
      elapsed.current = 0; lastBeep.current = null; active.current = true;
      pausedRef.current = document.hidden; setPaused(document.hidden);
      since.current = document.hidden ? null : performance.now();
      setRemaining(5000); setRunning(true);
    },
    finish() {
      const value = time(); active.current = false; since.current = null;
      setRemaining(5000 - value); setRunning(false); return value;
    },
    stop() { active.current = false; since.current = null; setRunning(false); pausedRef.current = false; setPaused(false); },
    resume() {
      if (!active.current || !pausedRef.current || document.hidden) return;
      audio.current.ready(); since.current = performance.now(); pausedRef.current = false; setPaused(false);
    },
  };
}
