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
async function advance() { await act(async () => { vi.advanceTimersByTime(850); }); }
beforeEach(async () => {
  localStorage.clear(); vi.useFakeTimers(); node = document.createElement('div'); document.body.append(node); root = createRoot(node);
  await act(async () => root.render(<MarketBlitzScreen onBack={() => {}} />));
});
afterEach(async () => { await act(async () => root.unmount()); node.remove(); vi.useRealTimers(); });
it('shows each product once, records a final-card error, and clears it only after a clean retry', async () => {
  await click('Начать проверку'); const seen = new Set<string>();
  for(let i=0;i<products.length;i++) {
    const correct = answer(); expect(seen.has(correct)).toBe(false); seen.add(correct);
    const options = [...node.querySelectorAll<HTMLButtonElement>('.blitz-option')];
    expect(options).toHaveLength(6); expect(new Set(options.map(b=>b.textContent)).size).toBe(6);
    if(i === products.length-1) {
      const wrong = options.find(b=>b.textContent !== correct)!;
      await act(async () => wrong.click()); expect(wrong.disabled).toBe(true);
      expect(answer()).toBe(correct); expect(JSON.parse(localStorage.getItem(key)!)).toContain(correct);
    }
    await click(correct); await advance();
  }
  expect(seen.size).toBe(products.length); expect(node.textContent).toContain('С первой попытки: 19 из 20');
  expect(JSON.parse(localStorage.getItem(key)!)).toHaveLength(1);
  await click('Проверить ошибки (1)'); await click(answer()); await advance();
  expect(node.textContent).toContain('С первой попытки: 1 из 1');
  expect(JSON.parse(localStorage.getItem(key)!)).toEqual([]);
});
it('keeps a repeatedly missed word for another retry and ignores rapid double answers', async () => {
  await click('Начать проверку'); const correct = answer();
  const wrong = [...node.querySelectorAll<HTMLButtonElement>('.blitz-option')].find(b=>b.textContent !== correct)!;
  await act(async () => wrong.click());
  const button = [...node.querySelectorAll<HTMLButtonElement>('.blitz-option')].find(b=>b.textContent === correct)!;
  await act(async () => { button.click(); button.click(); }); await advance();
  expect(node.textContent).toContain('Продукт 2 из 20');
  await act(async () => root.unmount());
  root = createRoot(node); await act(async () => root.render(<MarketBlitzScreen onBack={() => {}} />));
  await click('Проверить ошибки (1)');
  const bad = [...node.querySelectorAll<HTMLButtonElement>('.blitz-option')].find(b=>b.textContent !== answer())!;
  await act(async () => bad.click()); await click(answer()); await advance();
  expect(node.textContent).toContain('С первой попытки: 0 из 1');
  expect(JSON.parse(localStorage.getItem(key)!)).toHaveLength(1);
});
