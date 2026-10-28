export interface ScaleBlock { id: string; label: string }
export function balanceStacks(labels: string[]) {
  const left: ScaleBlock[] = [{ id: 'base-left', label: '' }];
  const right: ScaleBlock[] = [{ id: 'base-right-0', label: '' }, { id: 'base-right-1', label: '' }];
  labels.forEach((label, i) => {
    (i % 2 === 0 ? left : right).push({ id: `answer-${i}`, label });
    if (Math.max(left.length, right.length) > 3) { left.shift(); right.shift(); }
  });
  return { left, right };
}
