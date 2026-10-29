import { readJSON as read, writeJSON as write, hasLocalStorage } from '../../domain/storage';
export { hasLocalStorage };
export const beginnerStorageKey = (key: string) => `vietSveta.beginner.${key}`;
export function readJSON(key: string): unknown { return read(beginnerStorageKey(key)); }
export function writeJSON(key: string, value: unknown): void { write(beginnerStorageKey(key), value); }
