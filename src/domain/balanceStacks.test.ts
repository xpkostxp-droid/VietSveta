import { expect, it } from 'vitest';
import { balanceStacks } from './balanceStacks';
it('keeps answered words on alternating pans, removing only the oldest bottom pairs when full', () => {
 const first=balanceStacks(['Ai']); expect(first.left.map(b=>b.label)).toContain('Ai');
 const second=balanceStacks(['Ai','Gì']); expect(second.left.map(b=>b.label)).toContain('Ai'); expect(second.right.map(b=>b.label)).toContain('Gì');
 const labels=Array.from({length:20},(_,i)=>`word-${i}`); const full=balanceStacks(labels);
 expect(full.left.length).toBeLessThanOrEqual(3); expect(full.right.length).toBeLessThanOrEqual(3);
 expect(full.left[full.left.length - 1]?.label).toBe('word-18'); expect(full.right[full.right.length - 1]?.label).toBe('word-19');
 expect(full.left.some(b=>b.label==='word-0')).toBe(false);
});
