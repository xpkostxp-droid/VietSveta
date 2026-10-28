import { recordParticipantAttempt } from './leaderboard';
import { readJSON, writeJSON } from './storage';
export function formatAnswerTime(ms: number) {
  const tenths = Math.floor(Math.max(0, ms) / 100);
  return `${Math.floor(tenths / 600)}:${String(Math.floor(tenths / 10) % 60).padStart(2, '0')},${tenths % 10}`;
}
// Count only active question time; cap each question at its five-second limit.
export function createAnswerClock() {
  let total = 0, question = 0;
  let since: number | null = null;
  const elapsed = () => Math.min(5000, question + (since === null ? 0 : Math.max(0, Date.now() - since)));
  const pause = () => { question = elapsed(); since = null; };
  return {
    reset() { total = 0; question = 0; since = null; },
    begin() { question = 0; since = Date.now(); },
    pause,
    resume() { if (since === null) since = Date.now(); },
    finish() { pause(); total += question; question = 0; return total; },
    value() { return total + elapsed(); },
  };
}
export interface TimedAttempt {
  game: 'questions-24' | 'questions-15' | 'harvest-40' | 'harvest-review';
  correct: number;
  total: number | null;
  answerTimeMs: number;
  correctTimeMs: number;
  completed: boolean;
}
export function saveTimedAttempt(attempt: TimedAttempt) {
  recordParticipantAttempt(attempt.game, attempt.correct, attempt.correctTimeMs);
  const key = 'vietSveta.timedAttempts.v1';
  const existing = readJSON(key);
  const rows = Array.isArray(existing) ? existing : [];
  writeJSON(key, [...rows.slice(-99), { ...attempt, date: new Date().toISOString() }]);
}
