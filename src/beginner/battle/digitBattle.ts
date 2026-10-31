import { phoneDigitWords } from '../content/games/phone';
import { botPlan } from '../../battle/botBattle';
export const DIGIT_ROUND_MS = 5000;
export const DIGIT_TARGET = 8;
export type DigitSide = 'human' | 'bot';
export type DigitBattleState = {
 phase: 'ready' | 'question' | 'result' | 'finished'; round: number; digit: number;
 startsAt: number; resultAt: number; resultUntil: number;
 humanAnswered: boolean; botAnswered: boolean; humanChoice: number | null;
 cubes: Record<DigitSide, number[]>; winner: DigitSide | null;
};
export function createDigitBattle(random = Math.random, clock = Date.now) {
 let queue: number[] = [], previous = -1;
 const draw = () => {
  if (!queue.length) {
   queue = phoneDigitWords.map((_, i) => i);
   for (let i = queue.length - 1; i > 0; i--) { const j = Math.floor(random() * (i + 1)); [queue[i], queue[j]] = [queue[j], queue[i]]; }
   if (queue[0] === previous) [queue[0], queue[1]] = [queue[1], queue[0]];
  }
  previous = queue.shift()!; return previous;
 };
 const state: DigitBattleState = { phase: 'ready', round: 1, digit: draw(), startsAt: clock() + 3000, resultAt: 0, resultUntil: 0, humanAnswered: false, botAnswered: false, humanChoice: null, cubes: { human: [], bot: [] }, winner: null };
 let plan = botPlan(random), pausedAt: number | null = null;
 const snapshot = (): DigitBattleState => ({ ...state, cubes: { human: [...state.cubes.human], bot: [...state.cubes.bot] } });
 const settle = (winner: DigitSide | null, at: number) => {
  state.winner = winner; state.resultAt = at; state.resultUntil = at + 1100;
  if (winner) state.cubes[winner].push(state.digit);
  // Stop gameplay immediately on the eighth cube; its landing animation still plays.
  state.phase = winner && state.cubes[winner].length === DIGIT_TARGET ? 'finished' : 'result';
 };
 const advance = () => {
  if (pausedAt !== null) return;
  const now = clock();
  if (state.phase === 'result' && now >= state.resultUntil) {
   state.round++; state.digit = draw(); state.startsAt = now + 600; state.phase = 'ready';
   state.humanAnswered = false; state.botAnswered = false; state.humanChoice = null; state.winner = null; plan = botPlan(random);
  }
  if (state.phase === 'ready' && now >= state.startsAt) state.phase = 'question';
  if (state.phase !== 'question') return;
  if (!state.botAnswered && plan.kind !== 'skip' && now >= state.startsAt + plan.elapsed) {
   state.botAnswered = true;
   if (plan.kind === 'correct') settle('bot', state.startsAt + plan.elapsed);
   else if (state.humanAnswered) settle(null, state.startsAt + plan.elapsed);
  }
  if (state.phase === 'question' && now >= state.startsAt + DIGIT_ROUND_MS) settle(null, state.startsAt + DIGIT_ROUND_MS);
 };
 return {
  initial: snapshot,
  poll() { advance(); return snapshot(); },
  answer(digit: number, round: number) {
   advance();
   if (pausedAt !== null || state.phase !== 'question' || state.humanAnswered || round !== state.round || !Number.isInteger(digit) || digit < 0 || digit > 9) return snapshot();
   state.humanAnswered = true; state.humanChoice = digit;
   if (digit === state.digit) settle('human', clock());
   else if (state.botAnswered) settle(null, clock());
   return snapshot();
  },
  pause() { if (pausedAt === null) { advance(); pausedAt = clock(); } return snapshot(); },
  resume() {
   if (pausedAt !== null) { const delta = clock() - pausedAt; state.startsAt += delta; if (state.resultAt) state.resultAt += delta; if (state.resultUntil) state.resultUntil += delta; pausedAt = null; }
   return snapshot();
  },
 };
}
