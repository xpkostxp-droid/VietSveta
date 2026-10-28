// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { MarketBlitzScreen } from './MarketBlitzScreen';
import { products } from '../content/marketProducts';
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
let node: HTMLDivElement;
let root: Root;
const key = 'vietSveta.marketBlitz.errors.v1';
async function click(label: string) {
  const button = [...node.querySelectorAll('button')].find(b => b.textContent === label);
  expect(button, label).toBeTruthy();
  await act(async () => button!.click());
}
function answer() {
  const ru = node.querySelector('[role="img"]')!.getAttribute('aria-label');
  return products.find(p => p[2] === ru)![1];
}
async function time(ms: number) { await act(async () => { vi.advanceTimersByTime(ms); }); }
beforeEach(async () => {
  localStorage.clear(); vi.useFakeTimers(); Object.defineProperty(document, 'hidden', { configurable: true, value: false });
  node = document.createElement('div'); document.body.append(node); root = createRoot(node);
  await act(async () => root.render(<MarketBlitzScreen onBack={() => {}} />));
});
afterEach(async () => { await act(async () => root.unmount()); node.remove(); vi.useRealTimers(); });
it('has three choices, visits products once, explodes on a final error and clears it after a clean retry', async () => {
  await click('Начать проверку'); const seen = new Set<string>();
  for(let i=0;i<products.length;i++) {
    const correct = answer(); expect(seen.has(correct)).toBe(false); seen.add(correct);
    const options = [...node.querySelectorAll<HTMLButtonElement>('.blitz-option')];
    expect(options).toHaveLength(3); expect(new Set(options.map(b=>b.textContent)).size).toBe(3);
    if(i === products.length-1) {
      const wrong = options.find(b=>b.textContent !== correct)!;
      await act(async () => wrong.click());
      expect(node.querySelector('.harvest-wrong')).toBeTruthy();
      expect(options.every(b=>b.disabled)).toBe(true);
      expect(JSON.parse(localStorage.getItem(key)!)).toContain(correct);
    } else await click(correct);
    await time(1700);
  }
  expect(seen.size).toBe(products.length); expect(node.textContent).toContain('Собрано 19 из 20');
  expect(node.textContent).toContain('Лучшая серия: 19');
  await click('Добрать урожай — 1'); await click(answer()); await time(1700);
  expect(node.textContent).toContain('Весь урожай спасён!');
  expect(JSON.parse(localStorage.getItem(key)!)).toEqual([]);
});
it('times out at five seconds, records the word, and starts the next card with a fresh timer', async () => {
  await click('Начать проверку'); const word = answer(); await time(4900);
  expect(node.querySelector('.harvest-question')).toBeTruthy(); await time(100);
  expect(node.querySelector('.harvest-timeout')).toBeTruthy();
  expect(JSON.parse(localStorage.getItem(key)!)).toContain(word);
  await time(1700); expect(node.textContent).toContain('Продукт 2 из 20');
  expect(node.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow')).toBe('5');
});
it('pauses hidden tabs and requires explicit resume with the remaining time', async () => {
  await click('Начать проверку'); await time(2000);
  Object.defineProperty(document, 'hidden', { configurable: true, value: true });
  await act(async () => document.dispatchEvent(new Event('visibilitychange')));
  await time(20000); expect(node.textContent).toContain('Урожай подождёт');
  Object.defineProperty(document, 'hidden', { configurable: true, value: false });
  await click('Продолжить'); await time(2900); expect(node.querySelector('.harvest-question')).toBeTruthy();
  await time(100); expect(node.querySelector('.harvest-timeout')).toBeTruthy();
});
it('does not accept a rapid second answer or lose the saved error when leaving early', async () => {
  await click('Начать проверку'); const correct = answer();
  const buttons = [...node.querySelectorAll<HTMLButtonElement>('.blitz-option')];
  const wrong = buttons.find(b=>b.textContent !== correct)!;
  const right = buttons.find(b=>b.textContent === correct)!;
  await act(async () => { wrong.click(); right.click(); });
  expect(node.querySelector('.harvest-wrong')).toBeTruthy();
  expect(JSON.parse(localStorage.getItem(key)!)).toEqual([correct]);
  await time(1700); expect(node.textContent).toContain('Продукт 2 из 20');
});
