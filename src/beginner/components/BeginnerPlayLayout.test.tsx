import { act, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { mkdirSync, writeFileSync } from 'node:fs';
import { ProfessionsGameScreen } from './ProfessionsGameScreen';
import { TravelGameScreen } from './TravelGameScreen';
import { PeopleGameScreen } from './PeopleGameScreen';
import { FamilyGameScreen } from './FamilyGameScreen';
import { HouseGameScreen } from './HouseGameScreen';
import { RestaurantGameScreen } from './RestaurantGameScreen';
import { PhoneGameScreen } from './PhoneGameScreen';
import { CubesGameScreen } from './CubesGameScreen';
import { BigNumbersGameScreen } from './BigNumbersGameScreen';
import { DialogueGameScreen } from './DialogueGameScreen';
import { familyWords } from '../content/games/family';
import { houseLearning } from '../content/games/house';
import { bigNumberTiles } from '../content/games/bigNumbers';

vi.mock('./gameSounds', () => ({ makeGameSound: () => ({ ready: vi.fn(), beep: vi.fn(), close: vi.fn() }) }));
vi.mock('../content/games/phoneTone', () => ({ phoneToneUrl: () => 'blob:qa-tone' }));
vi.mock('../content/games/bigNumberAudio', () => ({ bigNumberAudio: vi.fn(async () => 'blob:qa-audio') }));
vi.mock('../domain/speech', () => ({ speakVietnamese: vi.fn(), stopSpeaking: vi.fn(), hasVietnameseVoice: () => true, onVoicesChanged: () => () => {} }));
vi.mock('../../components/GameRanking', () => ({ GameRanking: ({ onStart }: any) => <button onClick={onStart}>Начать</button> }));
vi.mock('../../domain/answerTime', () => ({ saveTimedAttempt: vi.fn() }));
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
let host: HTMLDivElement;
let root: ReturnType<typeof createRoot>;
beforeEach(() => {
  vi.useFakeTimers();
  vi.spyOn(Math, 'random').mockReturnValue(.999999);
  vi.spyOn(HTMLMediaElement.prototype, 'play').mockResolvedValue();
  vi.spyOn(HTMLMediaElement.prototype, 'pause').mockImplementation(() => {});
  URL.createObjectURL = vi.fn(() => 'blob:qa-audio'); URL.revokeObjectURL = vi.fn();
  host = document.createElement('div'); document.body.append(host); root = createRoot(host);
});
afterEach(() => { act(() => root.unmount()); host.remove(); vi.restoreAllMocks(); vi.useRealTimers(); });
async function render(node: ReactNode) { await act(async () => root.render(node)); }
async function click(text: string) {
  const button = Array.from(host.querySelectorAll<HTMLButtonElement>('button')).find(b => b.textContent?.trim() === text || b.querySelector('strong')?.textContent?.trim() === text);
  expect(button, text).toBeTruthy(); await act(async () => button!.click());
}
function capture(name: string) {
  const dir = process.env.BEGINNER_LAYOUT_QA_DIR;
  if (dir) { mkdirSync(dir, { recursive: true }); writeFileSync(`${dir}/${name}.fragment.html`, host.innerHTML); }
}
const cases: [string, () => ReactNode, string | null, number][] = [
  ['work', () => <ProfessionsGameScreen initialGroup="work" onBack={() => {}} />, 'Начать', 3],
  ['professions', () => <ProfessionsGameScreen initialGroup="professions" onBack={() => {}} />, 'Начать', 3],
  ['countries', () => <TravelGameScreen initialGroup="countries" onBack={() => {}} />, 'Начать', 3],
  ['travel', () => <TravelGameScreen initialGroup="travel" onBack={() => {}} />, 'Начать', 3],
  ['people', () => <PeopleGameScreen onBack={() => {}} />, 'Начать', 3],
  ['family', () => <FamilyGameScreen onBack={() => {}} />, 'Начать', 3],
  ['house', () => <HouseGameScreen onBack={() => {}} />, 'Начать', 3],
  ['adjectives', () => <HouseGameScreen game="adjectives" onBack={() => {}} />, 'Начать', 3],
  ['restaurant', () => <RestaurantGameScreen onBack={() => {}} />, null, 6],
  ['phone', () => <PhoneGameScreen onBack={() => {}} />, 'Начать', 10],
  ['cubes', () => <CubesGameScreen range="11-99" direction="vi-ru" onBack={() => {}} />, 'Начать игру', 6],
  ['hotel', () => <CubesGameScreen range="100-999" direction="vi-ru" onBack={() => {}} />, 'Начать игру', 6],
  ['banknotes', () => <CubesGameScreen range="banknotes" direction="vi-ru" onBack={() => {}} />, 'Начать игру', 6],
  ['banknotes-reverse', () => <CubesGameScreen range="banknotes" direction="ru-vi" onBack={() => {}} />, 'Начать игру', 4],
  ['big-numbers', () => <BigNumbersGameScreen onBack={() => {}} />, null, bigNumberTiles.length],
  ['big-numbers-reverse', () => <BigNumbersGameScreen reverse onBack={() => {}} />, null, 10],
  ['dialogue', () => <DialogueGameScreen direction="vi-ru" onBack={() => {}} />, null, 10],
];
it.each(cases)('uses the shared prompt/label and retains native choices in %s', async (name, factory, start, count) => {
  await render(factory());
  if (name === 'restaurant') await act(async () => host.querySelector<HTMLButtonElement>('.family-mode')!.click());
  else if (start) await click(start);
  expect(host.querySelector('.beginner-play .profession-illustration .profession-caption')).toBeTruthy();
  expect(host.querySelectorAll('.work-options button')).toHaveLength(count);
  expect(host.querySelector('.work-timebar')).toBeTruthy();
  capture(name);
});
it('keeps the family three-choice game and replay control inside the prompt after an answer', async () => {
  await render(<FamilyGameScreen onBack={() => {}} />); await click('Начать');
  await click(familyWords[0][1]);
  expect(host.querySelector('.work-options .family-correct')?.textContent).toBe(familyWords[0][1]);
  expect(host.querySelector('.work-prompt .beginner-prompt-tools button')).toBeTruthy();
  expect(host.querySelectorAll('.work-options button')).toHaveLength(3);
  capture('family-feedback');
  await act(async () => vi.advanceTimersByTime(1600));
  expect(host.querySelector('.profession-caption')?.textContent).toBe(familyWords[0][1]);
});
it('keeps house forward and reverse prompts in the shared frame with three fixed choices', async () => {
  await render(<HouseGameScreen onBack={() => {}} />); await click('Начать');
  await click(houseLearning[0][1]);
  expect(host.querySelectorAll('.work-options button')).toHaveLength(3);
  await act(async () => vi.advanceTimersByTime(1600));
  expect(host.querySelector('.profession-caption')?.textContent).toBe(houseLearning[0][1]);
  expect(host.querySelector('.profession-empty')).toBeTruthy();
  capture('house-reverse');
});
it('does not reveal a dialogue translation until requested and keeps every word choice after hints', async () => {
  await render(<DialogueGameScreen direction="vi-ru" onBack={() => {}} />);
  const words = Array.from(host.querySelectorAll('.work-options button')).map(b => b.textContent);
  expect(host.querySelector('.profession-caption')?.textContent).toBe('Слушай фразу');
  await click('Подсказка');
  expect(host.querySelector('.profession-caption')?.textContent).toBe('Сколько стоит?');
  expect(Array.from(host.querySelectorAll('.work-options button')).map(b => b.textContent)).toEqual(words);
  capture('dialogue-hint');
});

it('keeps six cube slots through a correct answer, clearing and refill', async () => {
  await render(<CubesGameScreen range="11-99" direction="vi-ru" onBack={() => {}} />); await click('Начать игру');
  const target = Number(host.querySelector('audio[src*="/numbers/"]')!.getAttribute('src')!.match(/\/(\d+)\.mp3/)![1]);
  await act(async () => host.querySelector<HTMLButtonElement>(`[data-value="${target}"]`)!.click());
  expect(host.querySelector('.work-options .cube-clearing')).toBeTruthy();
  expect(host.querySelectorAll('.work-options button')).toHaveLength(6);
  await act(async () => vi.advanceTimersByTime(750));
  await act(async () => vi.advanceTimersByTime(450));
  expect(host.querySelectorAll('.work-options button')).toHaveLength(6);
  expect(host.querySelectorAll('.work-options button:not(:disabled)')).toHaveLength(6);
});
it('retains banknote flipping without replacing or dropping any answer button', async () => {
  await render(<CubesGameScreen range="banknotes" direction="vi-ru" onBack={() => {}} />); await click('Начать игру');
  const target = Number(host.querySelector('audio[src*="/banknotes/"]')!.getAttribute('src')!.match(/\/(\d+)\.mp3/)![1]);
  await act(async () => host.querySelector<HTMLButtonElement>(`[data-value="${target}"]`)!.click());
  expect(host.querySelector('.work-options .banknote-flipped')).toBeTruthy();
  expect(host.querySelectorAll('.work-options button')).toHaveLength(6);
});
