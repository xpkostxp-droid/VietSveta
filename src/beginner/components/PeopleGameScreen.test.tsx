import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { PeopleGameScreen } from './PeopleGameScreen';
import { peopleWords, peopleBlitzTasks, peopleBlitzOptions, peopleBlitzAnswer } from '../content/games/people';
const sounds = vi.hoisted(() => ({ ready: vi.fn(), beep: vi.fn(), close: vi.fn() }));
vi.mock('./gameSounds', () => ({ makeGameSound: () => sounds }));
const attempts = vi.hoisted(() => ({ save: vi.fn() }));
vi.mock('../../domain/answerTime', () => ({ saveTimedAttempt: attempts.save }));
vi.mock('../../components/GameRanking', () => ({ GameRanking: ({ game, total, onStart, result }: any) => <div data-game={game}>Рейтинг участников{result && <p>Правильно: {result.correct} из {total}</p>}<button onClick={onStart}>Начать</button></div> }));
vi.mock('../domain/speech', () => ({ speakVietnamese: vi.fn(), stopSpeaking: vi.fn() }));
(globalThis as any).IS_REACT_ACT_ENVIRONMENT = true;
let root: ReturnType<typeof createRoot>;
let host: HTMLDivElement;
beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval', 'performance'] });
  vi.clearAllMocks(); localStorage.clear(); host = document.createElement('div'); document.body.append(host); root = createRoot(host);
  act(() => root.render(<PeopleGameScreen onBack={() => {}} />));
});
afterEach(() => { act(() => root.unmount()); host.remove(); vi.useRealTimers(); });
function click(text: string) { act(() => Array.from(host.querySelectorAll('button')).find(b => b.textContent?.trim() === text || b.querySelector('strong')?.textContent === text)!.click()); }
function start() { expect(host.textContent).toContain('Рейтинг участников'); click('Начать'); }
function correctAnswer() {
  const prompt = host.querySelector('.work-prompt h2')!.textContent;
  const reverse = host.querySelector('.work-prompt h2')!.getAttribute('lang') === 'vi';
  const word = peopleWords.find(w => w[reverse ? 1 : 2] === prompt)!;
  if (!reverse && prompt === 'Да — вежливый ответ') return Array.from(host.querySelectorAll('.work-options button')).map(b => b.textContent!).find(t => ['vâng','dạ'].includes(t))!;
  return word[reverse ? 2 : 1];
}
it('contains only seventeen words, tests both directions and never offers ambiguous or duplicate choices', () => {
 expect(peopleWords).toHaveLength(17);
 expect(host.textContent).not.toContain('Обучение');
 const tasks = peopleBlitzTasks(); expect(tasks).toHaveLength(34);
 expect(new Set(tasks.map(t => `${t.index}:${t.reverse}`)).size).toBe(34);
 for (let n = 0; n < 40; n++) for (const task of tasks) {
  const options = peopleBlitzOptions(task);
  expect(new Set(options).size).toBe(3); expect(options).toContain(peopleBlitzAnswer(task));
  if (!task.reverse) {
   if (['vâng','dạ'].includes(peopleWords[task.index][1])) expect(options.filter(o => ['vâng','dạ'].includes(o))).toHaveLength(1);
   if (['chị ấy','cô ấy'].includes(peopleWords[task.index][1])) expect(options.filter(o => ['chị ấy','cô ấy'].includes(o))).toHaveLength(1);
  }
 }
});
it('continues after mistakes and timeout, locks double answers, stores isolated best with correct response time', () => {
  start();
  for (let i = 0; i < 34; i++) {
    const correct = correctAnswer();
    if (i === 0) {
      act(() => vi.advanceTimersByTime(1000));
      const wrong = Array.from(host.querySelectorAll<HTMLButtonElement>('.work-options button')).find(b => b.textContent !== correct)!;
      act(() => { wrong.click(); wrong.click(); });
      expect(host.querySelectorAll('.family-correct')).toHaveLength(1);
    } else if (i === 1) {
      act(() => vi.advanceTimersByTime(5000)); expect(host.textContent).toContain('Время вышло');
    } else {
      act(() => vi.advanceTimersByTime(1000)); click(correct);
    }
    act(() => vi.advanceTimersByTime(1600));
  }
  expect(host.textContent).toContain('Правильно: 32 из 34');
  expect(host.textContent).toContain('Рейтинг участников');
  expect(attempts.save).toHaveBeenCalledTimes(1);
  expect(attempts.save).toHaveBeenCalledWith(expect.objectContaining({ game: 'lesson8-people', correct: 32, total: 34, correctTimeMs: 32000, completed: true }));
  expect(localStorage.getItem('work-blitz.v1.professions')).toBeNull();
});
it('pauses a hidden question until explicit resume and excludes the pause from time', () => {
  start();
  act(() => vi.advanceTimersByTime(1000));
  Object.defineProperty(document, 'hidden', { configurable: true, value: true });
  act(() => document.dispatchEvent(new Event('visibilitychange')));
  act(() => vi.advanceTimersByTime(15000)); expect(host.textContent).toContain('Игра на паузе');
  Object.defineProperty(document, 'hidden', { configurable: true, value: false });
  click('Продолжить'); act(() => vi.advanceTimersByTime(1000)); click(correctAnswer());
  expect(host.textContent).toContain('Верно!');
  act(() => vi.advanceTimersByTime(1600)); expect(host.querySelector('.work-status')!.textContent).toContain('2/34 · ✓ 1');
});

it('beeps once on 3, 2, 1 and stops after an answer', () => {
  start(); expect(sounds.ready).toHaveBeenCalled();
  act(() => vi.advanceTimersByTime(4000));
  expect(sounds.beep.mock.calls.map(c => c[0])).toEqual([3, 2, 1]);
  click(correctAnswer());
  act(() => vi.advanceTimersByTime(1500));
  expect(sounds.beep).toHaveBeenCalledTimes(3);
});
