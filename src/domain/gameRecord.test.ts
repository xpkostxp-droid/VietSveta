// @vitest-environment jsdom
import { beforeEach, expect, it } from 'vitest';
import { readGameRecord, updateGameRecord, isBetterRecord } from './gameRecord';
beforeEach(() => localStorage.clear());
it('ranks by count first and time second', () => {
 expect(isBetterRecord({correct:8,correctTimeMs:20000},{correct:7,correctTimeMs:1000})).toBe(true);
 expect(isBetterRecord({correct:7,correctTimeMs:5000},{correct:7,correctTimeMs:6000})).toBe(true);
 expect(isBetterRecord({correct:7,correctTimeMs:7000},{correct:7,correctTimeMs:6000})).toBe(false);
 expect(isBetterRecord({correct:6,correctTimeMs:100},{correct:7,correctTimeMs:6000})).toBe(false);
});
it('ignores old untimed records, persists fastest ties and isolates games', () => {
 localStorage.setItem('old','99'); expect(readGameRecord('questions-15','old').correct).toBe(0);
 updateGameRecord('questions-15',{correct:7,correctTimeMs:6000},'old');
 updateGameRecord('questions-15',{correct:7,correctTimeMs:5000},'old');
 updateGameRecord('questions-15',{correct:7,correctTimeMs:9000},'old');
 expect(readGameRecord('questions-15').correctTimeMs).toBe(5000);
 expect(readGameRecord('questions-24').correct).toBe(0);
});
