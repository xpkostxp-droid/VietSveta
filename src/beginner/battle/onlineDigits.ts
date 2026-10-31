import type { Match } from '../../battle/battleTypes';
import { phoneDigitWords } from '../content/games/phone';
import type { DigitBattleState } from './digitBattle';
export function onlineDigitSnapshot(match: Match, now: number): DigitBattleState {
 const own = match.side, other = own === 'host' ? 'guest' : 'host';
 const starts = match.starts_at ? Date.parse(match.starts_at) : Infinity;
 const result = match.last_result;
 const at = result?.at ? Date.parse(result.at) : 0;
 const between = !!result && (match.status === 'finished' || now < starts);
 const feedback = between && (match.status === 'finished' || now < starts - 600);
 const task = feedback ? result : match.task;
 const finished = match.status === 'finished';
 const cubes = match.digit_cubes ?? {host:[],guest:[]};
 return {
  phase: finished ? 'finished' : feedback ? 'result' : now < starts ? 'ready' : 'question',
  round: feedback ? (result?.round ?? match.round - 1) + 1 : match.round + 1,
  digit: Math.max(0,phoneDigitWords.indexOf(task?.word ?? '')),
  startsAt: feedback && result?.starts_at ? Date.parse(result.starts_at) : starts,
  resultAt: at, resultUntil: starts - 600,
  humanAnswered: match.answered, botAnswered: !!match.attempts?.some(a => a.side === other),
  humanChoice: null, cubes: {human:[...cubes[own]],bot:[...cubes[other]]},
  winner: feedback && result?.winner !== 'none' ? result?.winner === own ? 'human' : 'bot' : null,
 };
}
