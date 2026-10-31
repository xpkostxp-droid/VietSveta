import { useEffect } from 'react';
import { playBattleResultSound, type BattleResult } from './resultAudio';
/** Stable match identity prevents replay on repeated server snapshots. */
export function useBattleResultSound(key: string | null, result: BattleResult | null) {
 useEffect(() => {
  if (!key || !result || document.hidden) return;
  const stop = playBattleResultSound(result);
  const hide = () => { if (document.hidden) stop(); };
  document.addEventListener('visibilitychange', hide);
  return () => { stop(); document.removeEventListener('visibilitychange', hide); };
 }, [key,result]);
}
