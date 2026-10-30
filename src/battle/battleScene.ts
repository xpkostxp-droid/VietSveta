export type CourtWinner = 'near' | 'far' | 'both' | 'none';
export type CourtState = {
 key: string; round: number; now: number; starts: number;
 winner: CourtWinner; nearBlue: boolean; finalPointAt?:number;
};
export function sceneTiming(s: CourtState) {
 if(s.finalPointAt!==undefined)return {phase:'point' as const,corner:Math.max(0,s.round-1)%2,seconds:Math.max(0,(s.now-s.finalPointAt)/1000)};
 const between = Number.isFinite(s.starts) && s.now < s.starts;
 const point = between && s.round > 0;
 return {
  phase: point ? 'point' as const : between || !Number.isFinite(s.starts) ? 'waiting' as const : 'rally' as const,
  // Change corners only when the next question begins; there is no run animation.
  corner: Math.max(0, s.round - (point ? 1 : 0)) % 2,
  seconds: point ? Math.max(0, (s.now - (s.starts - 2000)) / 1000) : Math.max(0, (s.now - s.starts) / 1000),
 };
}
export function ownWinner(winner: string, side: 'host' | 'guest'): CourtWinner {
 return winner === 'both' || winner === 'none' ? winner : winner === side ? 'near' : 'far';
}
export function finalOutcome(host: number, guest: number, side: 'host' | 'guest') {
 if (host === guest) return null;
 return (host > guest) === (side === 'host') ? 'near' as const : 'far' as const;
}
