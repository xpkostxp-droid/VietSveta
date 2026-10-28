import { afterEach, expect, it, vi } from 'vitest';
import { createAnswerClock, formatAnswerTime } from './answerTime';
afterEach(() => { vi.useRealTimers(); });
it('counts only active answer time, excludes feedback and pause, and caps timeouts', () => {
 vi.useFakeTimers(); vi.setSystemTime(0); const clock=createAnswerClock(); clock.begin();
 vi.advanceTimersByTime(750); expect(clock.finish()).toBe(750);
 vi.advanceTimersByTime(1700); expect(clock.value()).toBe(750);
 clock.begin(); vi.advanceTimersByTime(500); clock.pause();
 vi.advanceTimersByTime(20000); expect(clock.value()).toBe(1250);
 clock.resume(); vi.advanceTimersByTime(250); expect(clock.finish()).toBe(1500);
 clock.begin(); vi.advanceTimersByTime(7000); expect(clock.finish()).toBe(6500);
 clock.reset(); expect(clock.value()).toBe(0);
});
it('formats tenths without losing stored millisecond precision', () => {
 expect(formatAnswerTime(61234)).toBe('1:01,2'); expect(formatAnswerTime(0)).toBe('0:00,0');
});
