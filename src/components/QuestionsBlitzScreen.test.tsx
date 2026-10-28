// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { beforeEach, afterEach, expect, it, vi } from 'vitest';
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
 expect(node.querySelector('.qs-controls')!.compareDocumentPosition(node.querySelector('.qs-timer-bottom')!) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
 expect(node.querySelector('.qs-prompt strong')?.textContent).toBe('Кто');
 expect([...node.querySelectorAll<HTMLButtonElement>('.qs-answer')].every(b=>b.disabled)).toBe(true);
 await time(1200); expect(node.querySelector('.qs-prompt strong')?.textContent).toBe('Gì');
 await click('Что'); expect(node.querySelector('.qs-score')?.textContent).toContain('2');
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
