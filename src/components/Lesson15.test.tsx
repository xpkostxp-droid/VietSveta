import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, expect, it, vi } from 'vitest';
import { TheoryListScreen } from './TheoryListScreen';
import { TheoryLessonScreen } from './TheoryLessonScreen';
import { CardsLessonListScreen } from './CardsLessonListScreen';
import { TrainingScreen } from './TrainingScreen';
import { getCardsForLesson } from '../content/cards';
import { getTheoryForLesson } from '../content/lessons';
import { lessons as beginnerLessons } from '../beginner/content/lessons';
vi.mock('../domain/speech', () => ({
  hasVietnameseVoice: () => false, isSpeechEnabled: () => false,
  onVoicesChanged: () => () => {}, setSpeechEnabled: vi.fn(),
  speakVietnamese: vi.fn(), stopSpeaking: vi.fn(),
}));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
const host = document.createElement('div');
let root: ReturnType<typeof createRoot>;
afterEach(() => { act(() => root.unmount()); host.innerHTML = ''; });
it('opens the advanced lesson from both lists and renders all 33 verbs in the notes', async () => {
  root = createRoot(host);
  const open = vi.fn();
  await act(async () => root.render(<TheoryListScreen onBack={() => {}} onOpenLesson={open} />));
  const lesson = [...host.querySelectorAll('button')].find(b => b.textContent?.includes('Урок 15'))!;
  expect(lesson.textContent).toContain('Глаголы');
  act(() => lesson.click()); expect(open).toHaveBeenCalledWith('lesson-15');
  await act(async () => root.render(<TheoryLessonScreen lessonId="lesson-15" onBack={() => {}} />));
  expect(host.textContent).not.toContain('Материалы скоро появятся');
  const cards = getCardsForLesson('lesson-15');
  expect(cards).toHaveLength(33);
  expect(new Set(cards.map(c => c.id)).size).toBe(33);
  const verbSections = getTheoryForLesson('lesson-15')!.filter(b => b.kind === 'vocab' && !b.heading?.includes('Полезные'));
  const verbs = verbSections.flatMap(b => b.kind === 'vocab' ? b.items.map(w => w.vi) : []);
  expect(verbs).toHaveLength(33);
  expect(new Set(verbs)).toEqual(new Set(cards.map(c => c.vi)));
  await act(async () => root.render(<CardsLessonListScreen onBack={() => {}} onOpenLesson={open} />));
  const cardLesson = [...host.querySelectorAll('button')].find(b => b.textContent?.includes('Урок 15'))!;
  expect(cardLesson.textContent).toContain('Карточек: 33');
  act(() => cardLesson.click()); expect(open).toHaveBeenLastCalledWith('lesson-15');
  expect(beginnerLessons.find(l => l.number === 15)?.title).not.toBe('Глаголы');
});
it.each(['ru-vi', 'vi-ru', 'listening'] as const)('reveals examples only after flipping in %s training', async direction => {
  root = createRoot(host);
  await act(async () => root.render(<TrainingScreen lessonId="lesson-15" direction={direction} order="sequential" onExit={() => {}} />));
  expect(host.textContent).toContain('Карточка 1 из 33');
  expect(host.querySelector('.flashcard-example')).toBeNull();
  act(() => host.querySelector<HTMLButtonElement>('.flashcard-card')!.click());
  expect(host.querySelector('.flashcard-example [lang="vi"]')?.textContent).toBe('Chị là giáo viên.');
  expect(host.querySelector('.flashcard-example [lang="ru"]')?.textContent).toBe('Я учительница.');
  act(() => host.querySelector<HTMLButtonElement>('.answer-yes')!.click());
  expect(host.textContent).toContain('Карточка 2 из 33');
  expect(host.querySelector('.flashcard-example')).toBeNull();
});
