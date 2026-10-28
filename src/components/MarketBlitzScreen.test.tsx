// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, expect, it, vi } from 'vitest';
import { MarketBlitzScreen } from './MarketBlitzScreen';
import { products } from '../content/marketProducts';
const audio = vi.hoisted(() => ({ beep: vi.fn(), explode: vi.fn(), unlock: vi.fn(), stop: vi.fn(), close: vi.fn() }));
vi.mock('../domain/countdownSound', () => ({ createCountdownSound: () => audio }));
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
let node: HTMLDivElement;
let root: Root;
const key = 'vietSveta.marketBlitz.errors.v2';
async function click(label: string) {
  const button = [...node.querySelectorAll('button')].find(b => b.textContent === label);
  expect(button, label).toBeTruthy();
  await act(async () => button!.click());
}
function answer() {
  const word = node.querySelector('.harvest-word-prompt')?.textContent;
  if (word) return products.find(p => p[1] === word)![2];
  const ru = node.querySelector('[role="img"]')!.getAttribute('aria-label');
  return products.find(p => p[2] === ru)![1];
}
function optionButtons() { return [...node.querySelectorAll<HTMLButtonElement>('.blitz-option')]; }
async function chooseCorrect() {
  const correct = answer();
  const button = optionButtons().find(b => b.getAttribute('aria-label') === correct)!;
  expect(button).toBeTruthy(); await act(async () => button.click());
}
async function time(ms: number) { await act(async () => { vi.advanceTimersByTime(ms); }); }
beforeEach(async () => {
  vi.clearAllMocks(); localStorage.clear(); vi.useFakeTimers(); Object.defineProperty(document, 'hidden', { configurable: true, value: false });
  node = document.createElement('div'); document.body.append(node); root = createRoot(node);
  await act(async () => root.render(<MarketBlitzScreen onBack={() => {}} />));
});
afterEach(async () => { await act(async () => root.unmount()); node.remove(); vi.useRealTimers(); });
it('has three choices, visits products once, explodes on a final error and clears it after a clean retry', async () => {
  await click('Начать проверку'); const seen = new Set<string>();
  for(let i=0;i<products.length * 2;i++) {
    const correct = answer(); expect(seen.has(correct)).toBe(false); seen.add(correct);
    const options = [...node.querySelectorAll<HTMLButtonElement>('.blitz-option')];
    expect(options).toHaveLength(3); expect(new Set(options.map(b=>b.textContent)).size).toBe(3);
    if(i === products.length * 2 - 1) {
      const wrong = options.find(b=>b.getAttribute('aria-label') !== correct)!;
      await act(async () => wrong.click());
      expect(node.querySelector('.harvest-wrong')).toBeTruthy();
      expect(options.every(b=>b.disabled)).toBe(true);
      expect(JSON.parse(localStorage.getItem(key)!)).toContain(products.find(p => p[2] === correct)![1] + '|picture');
    } else await chooseCorrect();
    if (i === products.length * 2 - 1) await time(700);
    await time(1700);
  }
  expect(seen.size).toBe(products.length * 2); expect(node.textContent).toContain('Собрано 39 из 40');
  expect(node.textContent).toContain('Лучшая серия: 39');
  await click('Добрать урожай — 1'); await chooseCorrect(); await time(1700);
  expect(node.textContent).toContain('Весь урожай спасён!');
  expect(JSON.parse(localStorage.getItem(key)!)).toEqual([]);
});
it('times out at five seconds, records the word, and starts the next card with a fresh timer', async () => {
  await click('Начать проверку'); const word = answer(); await time(4900);
  expect(node.querySelector('.harvest-question')).toBeTruthy(); await time(100);
  expect(node.querySelector('.harvest-timeout')).toBeTruthy();
  expect(audio.explode).toHaveBeenCalledTimes(1);
  expect(JSON.parse(localStorage.getItem(key)!)).toContain(word + '|word');
  await time(700); await time(1700); expect(node.textContent).toContain('Задание 2/40');
  expect(node.querySelector('[role="progressbar"]')?.getAttribute('aria-valuenow')).toBe('5');
});
it('pauses hidden tabs and requires explicit resume with the remaining time', async () => {
  await click('Начать проверку'); await time(2000);
  Object.defineProperty(document, 'hidden', { configurable: true, value: true });
  await act(async () => document.dispatchEvent(new Event('visibilitychange')));
  await time(20000); expect(node.textContent).toContain('Пауза');
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
  expect(JSON.parse(localStorage.getItem(key)!)).toEqual([correct + '|word']);
  await time(700); await time(1700); expect(node.textContent).toContain('Задание 2/40');
});

it('warns only at three, two and one seconds and reveals the answer after the explosion', async () => {
  await click('Начать проверку');
  await time(1900); expect(audio.beep).not.toHaveBeenCalled();
  await time(100); expect(audio.beep).toHaveBeenCalledTimes(1);
  await time(1000); expect(audio.beep).toHaveBeenCalledTimes(2);
  await time(1000); expect(audio.beep).toHaveBeenCalledTimes(3);
  const correct = answer();
  await time(1000); expect(node.querySelector('.harvest-shake')).toBeTruthy();
  expect(node.querySelector('.harvest-answer-slot strong')?.textContent).not.toBe(correct);
  expect(node.querySelector('.blitz-correct')).toBeNull();
  await time(699); expect(node.querySelector('.harvest-answer-slot strong')?.textContent).not.toBe(correct);
  await time(1); expect(node.querySelector('.harvest-answer-slot strong')?.textContent).toBe(correct);
  expect(audio.beep).toHaveBeenCalledTimes(3);
});
