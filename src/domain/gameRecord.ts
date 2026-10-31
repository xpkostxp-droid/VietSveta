import { readJSON, writeJSON } from './storage';
export interface GameRecord { correct: number; correctTimeMs: number | null }
function key(game: string) { return `vietSveta.gameRecord.${game}.${game==='harvest-fruits'||game==='harvest-vegetables'?'v2':'v1'}`; }
export function readGameRecord(game: string, _legacyKey?: string): GameRecord {
  const raw = readJSON(key(game)) as Partial<GameRecord> | undefined;
  if (raw && Number.isInteger(raw.correct) && raw.correct! >= 0 && (raw.correctTimeMs === null || typeof raw.correctTimeMs === 'number' && Number.isFinite(raw.correctTimeMs) && raw.correctTimeMs >= 0)) return raw as GameRecord;
  return { correct: 0, correctTimeMs: null };
}
export function isBetterRecord(candidate: GameRecord, previous: GameRecord) {
  return candidate.correct > previous.correct || candidate.correct === previous.correct && candidate.correctTimeMs !== null && (previous.correctTimeMs === null || candidate.correctTimeMs < previous.correctTimeMs);
}
export function updateGameRecord(game: string, candidate: GameRecord, legacyKey?: string): GameRecord {
  const previous = readGameRecord(game, legacyKey);
  if (candidate.correct > 0 && isBetterRecord(candidate, previous)) {
    writeJSON(key(game), candidate);
    if (legacyKey) writeJSON(legacyKey, candidate.correct);
    return candidate;
  }
  return previous;
}
