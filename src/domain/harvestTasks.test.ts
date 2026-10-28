import { expect, it } from 'vitest';
import { allHarvestTasks, orderHarvestTasks, productForTask, isPictureAnswer, readHarvestErrors } from './harvestTasks';
it('alternates directions across 40 unique tasks without adjacent duplicate products', () => {
  for (let run = 0; run < 20; run++) {
    const tasks = orderHarvestTasks(allHarvestTasks);
    expect(tasks).toHaveLength(40); expect(new Set(tasks).size).toBe(40);
    tasks.forEach((t, i) => {
      expect(isPictureAnswer(t)).toBe(i % 2 === 1);
      if (i) expect(productForTask(t)).not.toBe(productForTask(tasks[i - 1]));
    });
  }
});
it('migrates legacy errors into both directions and prefers current direction-specific data', () => {
  expect(readHarvestErrors(undefined, ['cà chua'])).toEqual([0, 1]);
  expect(readHarvestErrors(['cà chua|picture'], ['cà chua'])).toEqual([1]);
  expect(readHarvestErrors([], ['cà chua'])).toEqual([]);
});
