// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
import { basicQuestions } from '../content/basicQuestions';
import { QuestionsBlitzScreen } from './QuestionsBlitzScreen';
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
let node: HTMLDivElement; let root: Root;
async function click(label: string) { const button = [...node.querySelectorAll('button')].find(b => b.textContent === label)!; expect(button).toBeTruthy(); await act(async () => button.click()); }
async function time(ms: number) { await act(async () => vi.advanceTimersByTime(ms)); }
beforeEach(async () => { vi.useFakeTimers(); vi.spyOn(Math, 'random').mockReturnValue(.99999); localStorage.clear(); node=document.createElement('div'); document.body.append(node); root=createRoot(node); await act(async () => root.render(<QuestionsBlitzScreen onBack={() => {}}/>)); });
afterEach(async () => { await act(async () => root.unmount()); node.remove(); vi.restoreAllMocks(); vi.useRealTimers(); });
it('balances on a correct answer, keeps the same direction during feedback and switches on the next question', async () => {
 await click('⚡ Начать суперблиц');
 expect(node.querySelector('h1')).toBeNull(); expect(node.querySelector('.qs-prompt strong')?.textContent).toBe('Кто');
 expect(node.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow')).toBe('5');
 await click('Ai'); expect(node.querySelector('.scale-success')).toBeTruthy();
 expect(node.querySelector('.scale-answer-label')?.textContent).toBe('Ai');
 expect(node.querySelector('.qs-timer-top')!.compareDocumentPosition(node.querySelector('.qs-controls')!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
 expect(node.querySelector('.qs-prompt strong')?.textContent).toBe('Кто');
 expect([...node.querySelectorAll<HTMLButtonElement>('.qs-answer')].every(b=>b.disabled)).toBe(true);
 await time(1200); expect(node.querySelector('.qs-prompt strong')?.textContent).toBe('Gì');
 expect(node.querySelector('.scale-answer-label')?.textContent).toBe('Ai');
 await click('Что'); expect(node.querySelector('.qs-score')?.textContent).toContain('2');
 expect([...node.querySelectorAll('.scale-answer-label')].map(n=>n.textContent)).toEqual(expect.arrayContaining(['Ai','Gì']));
 expect(localStorage.getItem('vietsveta.questions.blitz.best')).toBe('2');
});
it('tips and spills after a wrong answer, then retries the missed question first', async () => {
 await click('⚡ Начать суперблиц'); await click('Ai'); await time(1200);
 await click('Кто'); expect(node.querySelector('.scale-failed')).toBeTruthy(); expect(node.querySelectorAll('.scale-spill')).toHaveLength(2);
 expect(node.querySelector('.qs-end')?.textContent).toContain('Gì');
 await click('Играть снова'); expect(node.querySelector('.qs-prompt strong')?.textContent).toBe('Что');
 expect(node.querySelector('.qs-score')?.textContent).toContain('0');
});
it('times out at five seconds without awarding a point', async () => {
 await click('⚡ Начать суперблиц'); await time(4900); expect(node.querySelector('.scale-failed')).toBeNull();
 await time(100); expect(node.querySelector('.scale-failed')).toBeTruthy(); expect(node.textContent).toContain('Время вышло!');
 expect(localStorage.getItem('vietsveta.questions.blitz.best')).toBeNull();
});

it('separates a long parenthetical clarification from the centered main question', async () => {
 await click('⚡ Начать суперблиц');
 for (const label of ['Ai','Что','Ở đâu','Куда','Từ đâu','Когда','Ngày nào','Во сколько','Tại sao','Как']) { await click(label); await time(1200); }
 expect(node.querySelector('.qs-prompt strong')?.textContent).toBe('Сколько');
 expect(node.querySelector('.qs-prompt-note')?.textContent).toBe('общее количество');
});

it('basic mode checks all 15 words in both directions, finishes at 30 and keeps a separate record', async () => {
 await act(async () => root.unmount()); root=createRoot(node);
 await act(async () => root.render(<QuestionsBlitzScreen variant="basic" onBack={() => {}}/>));
 expect(node.textContent).toContain('30 заданий'); await click('⚡ Начать блиц');
 const seen = new Set<string>();
 for (let i=0;i<30;i++) {
  const main=node.querySelector('.qs-prompt strong')!.textContent!;
  const note=node.querySelector('.qs-prompt-note')?.textContent;
  const prompt=note ? main+' ('+note+')' : main;
  const reverse=node.querySelector('.qs-prompt small')!.textContent==='Выбери перевод';
  const pair=basicQuestions.find(p=>p[reverse?0:1]===prompt)!;
  expect(pair).toBeTruthy(); expect(seen.has(pair[0]+reverse)).toBe(false); seen.add(pair[0]+reverse);
  expect(reverse).toBe(i%2===1); await time(200); await click(pair[reverse?1:0]); await time(1200);
 }
 expect(node.textContent).toContain('Время правильных ответов: 0:06,0');
 const attempts=JSON.parse(localStorage.getItem('vietSveta.timedAttempts.v1')!);
 expect(attempts[attempts.length-1].answerTimeMs).toBe(6000);
 expect(seen.size).toBe(30); expect(node.textContent).toContain('30 из 30');
 expect(node.querySelector('.qs-answers')).toBeNull();
 expect(localStorage.getItem('vietsveta.questions.basic15.best')).toBe('30');
 expect(localStorage.getItem('vietsveta.questions.blitz.best')).toBeNull();
 await time(6000); expect(node.textContent).not.toContain('Время вышло!');
});
it('excludes the losing question and replaces an equal-score record with a faster run', async () => {
 await click('⚡ Начать суперблиц'); await time(300); await click('Ai'); await time(1200);
 await time(4000); await click('Кто');
 let rows=JSON.parse(localStorage.getItem('vietSveta.timedAttempts.v1')!);
 expect(rows[rows.length-1].correctTimeMs).toBe(300);
 expect(rows[rows.length-1].answerTimeMs).toBe(4300);
 await click('Играть снова'); await time(100); await click('Gì'); await time(1200);
 await click('Где');
 const record=JSON.parse(localStorage.getItem('vietSveta.gameRecord.questions-24.v1')!);
 expect(record).toEqual({correct:1,correctTimeMs:100});
 expect(node.textContent).toContain('0,10 сек');
});
