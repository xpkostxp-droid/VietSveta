import { products } from '../content/advancedProduce';
export const allHarvestTasks = products.flatMap((_, i) => [i * 2, i * 2 + 1]);
export const productForTask = (task: number) => Math.floor(task / 2);
export const isPictureAnswer = (task: number) => task % 2 === 1;
export const taskKey = (task: number) => `${products[productForTask(task)][1]}|${isPictureAnswer(task) ? 'picture' : 'word'}`;
function shuffle(items: number[]) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}
export function orderHarvestTasks(tasks: number[]) {
  const words = shuffle(tasks.filter(t => !isPictureAnswer(t)));
  const pictures = shuffle(tasks.filter(isPictureAnswer));
  const result: number[] = [];
  // Avoid placing either direction of a product next to its other direction.
  const take = (pool: number[]) => {
    const previous = result.length ? productForTask(result[result.length - 1]) : -1;
    const next = pool.findIndex(t => productForTask(t) !== previous);
    result.push(pool.splice(next < 0 ? 0 : next, 1)[0]);
  };
  if (tasks.length === allHarvestTasks.length && new Set(tasks).size === tasks.length) {
    const base = shuffle(products.map((_, i) => i));
    return base.flatMap((p, i) => [p * 2, base[(i + Math.floor(base.length / 2)) % base.length] * 2 + 1]);
  }
  while (words.length || pictures.length) {
    if (words.length) take(words);
    if (pictures.length) take(pictures);
  }
  return result;
}
export function readHarvestErrors(current: unknown, legacy: unknown): number[] {
  if (Array.isArray(current)) {
    const normalized=current.map(key=>typeof key==='string'?key.replace(/^ngô\|/, 'bắp / ngô|'):key);
    return allHarvestTasks.filter(t => normalized.includes(taskKey(t)));
  }
  return Array.isArray(legacy) ? allHarvestTasks.filter(t => legacy.includes(products[productForTask(t)][1])) : [];
}
