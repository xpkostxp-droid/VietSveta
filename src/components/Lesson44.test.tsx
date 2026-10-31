// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, it, vi } from 'vitest';
import { TheoryListScreen } from './TheoryListScreen';
import { TheoryLessonScreen } from './TheoryLessonScreen';
import { CardsLessonListScreen } from './CardsLessonListScreen';
import { TrainingScreen } from './TrainingScreen';
import { getCardsForLesson } from '../content/cards';
import { getTheoryForLesson } from '../content/lessons';
vi.mock('../domain/speech', () => ({
  hasVietnameseVoice: () => false, isSpeechEnabled: () => false,
  onVoicesChanged: () => () => {}, setSpeechEnabled: vi.fn(),
  speakVietnamese: vi.fn(), stopSpeaking: vi.fn(),
}));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const host = document.createElement('div');
let root: ReturnType<typeof createRoot>;
afterEach(() => { act(() => root.unmount()); host.innerHTML = ''; });
it('opens lesson 44 in both advanced lists and shows the complete notes without duplicates', async () => {
  root = createRoot(host); const open = vi.fn();
  await act(async () => root.render(<TheoryListScreen onBack={() => {}} onOpenLesson={open} />));
  const button = [...host.querySelectorAll('button')].find(b => b.textContent?.includes('Урок 44'))!;
  expect(button.textContent).toContain('Фрукты');act(() => button.click());expect(open).toHaveBeenLastCalledWith('lesson-44');
  await act(async () => root.render(<TheoryLessonScreen lessonId="lesson-44" onBack={() => {}} />));
  expect(host.textContent).not.toContain('Материалы скоро появятся');
  for (const text of ['nhãn', 'sầu riêng', 'mâm xôi', 'nước mía', 'xoài cát chu', 'chuối ta', 'sữa chua']) expect(host.textContent).toContain(text);
  const cards = getCardsForLesson('lesson-44');expect(cards).toHaveLength(48);
  expect(cards.map(c => c.id)).toEqual(Array.from({length:48},(_,i)=>`l44-${String(i+1).padStart(2,'0')}`));
  const vocab = getTheoryForLesson('lesson-44')!.flatMap(b => b.kind === 'vocab' ? b.items : []);
  expect(vocab).toHaveLength(48);expect(new Set(vocab.map(w => w.vi)).size).toBe(48);
  expect(new Set(vocab.map(w => w.vi))).toEqual(new Set(cards.map(w => w.vi)));
  expect(cards.find(c => c.vi === 'xoài vàng')?.ru).toBe('жёлтое манго');
  expect(cards.find(c => c.vi === 'nước mía')?.ru).toBe('сок сахарного тростника');
  await act(async () => root.render(<CardsLessonListScreen onBack={() => {}} onOpenLesson={open} />));
  const cardButton = [...host.querySelectorAll('button')].find(b => b.textContent?.includes('Урок 44'))!;
  expect(cardButton.textContent).toContain('Карточек: 48');act(() => cardButton.click());expect(open).toHaveBeenLastCalledWith('lesson-44');
});
it('keeps the existing card order and supports flipping lesson 44 cards', async () => {
  root = createRoot(host);
  await act(async () => root.render(<TrainingScreen lessonId="lesson-44" direction="ru-vi" order="sequential" onExit={() => {}} />));
  expect(host.textContent).toContain('Карточка 1 из 48');
  act(() => host.querySelector<HTMLButtonElement>('.flashcard-card')!.click());expect(host.textContent).toContain('trái cây');
});
