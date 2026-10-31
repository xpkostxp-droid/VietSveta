import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { HouseGameScreen } from './HouseGameScreen';
import { houseGameWords, houseGameTasks, houseGameOptions, type HouseGame } from '../content/games/house';
vi.mock('../domain/speech', () => ({ speakVietnamese: vi.fn(), stopSpeaking: vi.fn(), hasVietnameseVoice: () => true, onVoicesChanged: () => () => {} }));
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
let host: HTMLDivElement, root: ReturnType<typeof createRoot>;
beforeEach(() => { vi.useFakeTimers(); host = document.createElement('div'); document.body.append(host); root = createRoot(host); });
afterEach(() => { act(() => root.unmount()); host.remove(); vi.useRealTimers(); });
function click(text: string) { act(() => Array.from(host.querySelectorAll('button')).find(b => b.textContent === text)!.click()); }
it.each(['house', 'adjectives'] as HouseGame[])('asks each unique %s word exactly once in each direction, even after mistakes', game => {
  const words = houseGameWords(game);
  const tasks = houseGameTasks(game);
  expect(words.length).toBe(game === 'house' ? 18 : 19);
  expect(new Set(words.map(word => word[1])).size).toBe(words.length);
  expect(tasks.length).toBe(words.length * 2);
  expect(new Set(tasks.map(task => `${task.index}:${task.reverse}`)).size).toBe(tasks.length);
  for (const task of tasks) {
    const options = houseGameOptions(game, task);
    expect(options).toContain(task.index); expect(new Set(options).size).toBe(3);
  }
  act(() => root.render(<HouseGameScreen game={game} onBack={() => {}} />)); click('Начать');
  const seen = new Set<string>();
  for (let i = 0; i < tasks.length; i++) {
    const caption = host.querySelector('.profession-caption')!;
    const reverse = caption.getAttribute('lang') === 'vi';
    const index = words.findIndex(word => word[reverse ? 1 : 2] === caption.textContent);
    expect(index).toBeGreaterThanOrEqual(0);
    const key = `${index}:${reverse}`; expect(seen.has(key)).toBe(false); seen.add(key);
    expect(Boolean(host.querySelector('.profession-empty'))).toBe(reverse);
    expect(host.querySelectorAll('.work-options button')).toHaveLength(3);
    const correct = words[index][reverse ? 2 : 1];
    const button = Array.from(host.querySelectorAll<HTMLButtonElement>('.work-options button')).find(button => i === 0 ? button.textContent !== correct : button.textContent === correct)!;
    act(() => { button.click(); button.click(); });
    expect(host.querySelector('.family-correct')?.textContent).toBe(correct);
    act(() => vi.advanceTimersByTime(1600));
  }
  expect(seen.size).toBe(tasks.length);
  expect(host.textContent).toContain(`Правильно: ${tasks.length - 1} из ${tasks.length}`);
  expect(host.querySelector('.work-options')).toBeNull();
});
