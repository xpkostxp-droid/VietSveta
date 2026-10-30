import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { speakVietnamese } from '../domain/speech';
import { ProfessionsGameScreen } from './ProfessionsGameScreen';
import { professionWords, workBlitzTasks, workBlitzOptions, workBlitzAnswer } from '../content/games/professions';
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
  act(() => root.render(<ProfessionsGameScreen onBack={() => {}} />));
});
afterEach(() => { act(() => root.unmount()); host.remove(); vi.useRealTimers(); });
function click(text: string) { act(() => Array.from(host.querySelectorAll('button')).find(b => b.textContent?.trim() === text || b.querySelector('strong')?.textContent === text)!.click()); }
function start(group = 'Профессии') { click(group); expect(host.textContent).toContain('Рейтинг участников'); click('Начать'); }
function correctAnswer() {
  const photo=host.querySelector<HTMLImageElement>('.profession-photo');
  if(photo){const id=photo.getAttribute('src')!.split('/').pop()!.replace('.webp','');return professionWords.find(w=>w[0]===id)![1];}
  const prompt = host.querySelector('.work-prompt h2')!.textContent;
  const reverse = host.querySelector('.work-prompt h2')!.getAttribute('lang') === 'vi';
  const word = professionWords.find(w => w[reverse ? 1 : 2] === prompt)!;
  return word[reverse ? 2 : 1];
}
it('has two groups, every word twice, three options and only question distractors for questions', () => {
  expect(host.querySelectorAll('.work-group-list button')).toHaveLength(2);
  expect(host.textContent).not.toContain('Обучение');
  for (const group of ['professions', 'work'] as const) {
    const tasks = workBlitzTasks(group);
    expect(tasks).toHaveLength(group === 'professions' ? 30 : 28);
    expect(new Set(tasks.map(t => `${t.index}:${t.reverse}`)).size).toBe(tasks.length);
    for (const task of tasks) {
      const options = workBlitzOptions(task, group);
      expect(new Set(options).size).toBe(3); expect(options).toContain(workBlitzAnswer(task));
      if (professionWords[task.index][0].startsWith('ask-')) expect(options.every(o => o.endsWith('?'))).toBe(true);
    }
  }
});
it('continues after mistakes and timeout, locks double answers, stores isolated best with correct response time', () => {
  start();
  for (let i = 0; i < 30; i++) {
    const correct = correctAnswer();
    if(host.querySelector('.profession-photo')){expect(host.querySelector('.profession-caption')?.getAttribute('lang')).toBe('ru');expect(host.querySelector('.profession-caption')?.textContent).toBe(professionWords.find(w=>w[1]===correct)![2]);}
    else expect(host.querySelector('.work-prompt img')).toBeNull();
    if (i === 0) {
      act(() => vi.advanceTimersByTime(1000));
      const wrong = Array.from(host.querySelectorAll<HTMLButtonElement>('.work-options button')).find(b => b.textContent !== correct)!;
      act(() => { wrong.click(); wrong.click(); });
      expect(host.querySelectorAll('.family-correct')).toHaveLength(1);
    } else if (i === 1) {
      act(() => vi.advanceTimersByTime(5000)); expect(host.querySelectorAll('.family-correct')).toHaveLength(1);expect(host.textContent).not.toContain('Время вышло');
    } else {
      act(() => vi.advanceTimersByTime(1000)); click(correct);
    }
    act(() => vi.advanceTimersByTime(1600));
  }
  expect(host.textContent).toContain('Правильно: 28 из 30');
  expect(host.textContent).toContain('Рейтинг участников');
  expect(attempts.save).toHaveBeenCalledTimes(1);
  expect(attempts.save).toHaveBeenCalledWith(expect.objectContaining({ game: 'lesson5-professions', correct: 28, total: 30, correctTimeMs: 28000, completed: true }));
  expect(localStorage.getItem('work-blitz.v1.professions')).toBeNull();
});
it('pauses a hidden question until explicit resume and excludes the pause from time', () => {
  start('Места, действия и вопросы');
  act(() => vi.advanceTimersByTime(1000));
  Object.defineProperty(document, 'hidden', { configurable: true, value: true });
  act(() => document.dispatchEvent(new Event('visibilitychange')));
  act(() => vi.advanceTimersByTime(15000)); expect(host.textContent).toContain('Игра на паузе');
  Object.defineProperty(document, 'hidden', { configurable: true, value: false });
  click('Продолжить'); act(() => vi.advanceTimersByTime(1000)); click(correctAnswer());
  expect(host.querySelectorAll('.family-correct')).toHaveLength(1);expect(host.textContent).not.toContain('Верно!');
  act(() => vi.advanceTimersByTime(1600)); expect(host.querySelector('.work-status')!.textContent).toContain('2/28 · ✓ 1');
});

it('beeps once on 3, 2, 1 and stops after an answer', () => {
  start(); expect(sounds.ready).toHaveBeenCalled();
  act(() => vi.advanceTimersByTime(4000));
  expect(sounds.beep.mock.calls.map(c => c[0])).toEqual([3, 2, 1]);
  click(correctAnswer());
  act(() => vi.advanceTimersByTime(1500));
  expect(sounds.beep).toHaveBeenCalledTimes(3);
});

it('opens the profile-linked subgroup directly and returns to the profile',()=>{
 const back=vi.fn();
 act(()=>root.render(<ProfessionsGameScreen key="profile-link" initialGroup="work" onBack={back}/>));
 expect(host.querySelector('[data-game="lesson5-work"]')).toBeTruthy();
 expect(host.querySelector('.work-group-list')).toBeNull();
 act(()=>host.querySelector<HTMLButtonElement>('button')!.click());
 expect(back).toHaveBeenCalledOnce();
});

it('keeps the Russian caption within the image for correct, wrong and timeout answers; reverse tasks have no image',()=>{
 start();let pictures=0,reverses=0;
 for(let i=0;i<30;i++){
  const photo=host.querySelector<HTMLImageElement>('.profession-photo');const right=correctAnswer();
  if(photo){
   const word=professionWords.find(w=>w[1]===right)!;
   const caption=host.querySelector('.profession-illustration .profession-caption')!;
   expect(caption.textContent).toBe(word[2]);expect(caption.getAttribute('lang')).toBe('ru');
   if(pictures%3===0)click(right);
   else if(pictures%3===1){const wrong=Array.from(host.querySelectorAll<HTMLButtonElement>('.work-options button')).find(b=>b.textContent!==right)!;act(()=>wrong.click());}
   else act(()=>vi.advanceTimersByTime(5000));
   expect(host.querySelector('.profession-caption')?.textContent).toBe(word[2]);
   expect(host.querySelector('.family-correct')?.textContent).toBe(right);
   expect(speakVietnamese).toHaveBeenLastCalledWith(word[1]);pictures++;
  }else{
   reverses++;expect(host.querySelector('.work-prompt h2')?.getAttribute('lang')).toBe('vi');
   click(right);expect(host.querySelector('.work-prompt img')).toBeNull();
  }
  act(()=>vi.advanceTimersByTime(1600));
 }
 expect(pictures).toBe(15);expect(reverses).toBe(15);
});
