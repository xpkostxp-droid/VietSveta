// @vitest-environment jsdom
import { act } from 'react';
import { createRoot } from 'react-dom/client';
import { expect, it } from 'vitest';
import { MarketGameScreen } from './MarketGameScreen';
Object.assign(globalThis, { IS_REACT_ACT_ENVIRONMENT: true });
it('keeps learning controls mounted, blocks hidden ratings, and completes a round', async () => {
  localStorage.clear(); const node = document.createElement('div'); document.body.append(node); const root = createRoot(node);
  const button = (name: string) => [...node.querySelectorAll('button')].find(b => b.textContent === name)!;
  const click = async (name: string) => { expect(button(name)).toBeTruthy(); await act(async () => button(name).click()); };
  try {
    await act(async () => root.render(<MarketGameScreen onBack={() => {}} />));
    await click('🧺 Обучение'); await click('Овощи · урок 43'); await click('На рынок →');
    const ratings = node.querySelector('.learning-ratings'); const tools = node.querySelector('.learning-toolbar');
    expect(button('Вспомнил').disabled).toBe(true);
    await click('Первая буква'); await click('Показать ответ');
    expect(node.querySelector('.learning-ratings')).toBe(ratings); expect(node.querySelector('.learning-toolbar')).toBe(tools);
    expect(button('Вспомнил').disabled).toBe(true); await click('С подсказкой');
    for (let i = 0; i < 10; i++) { await click('Показать ответ'); await click('Вспомнил'); }
    expect(node.textContent).toContain('Корзина собрана!'); expect(node.textContent).not.toContain('Вспомнила');
  } finally { await act(async () => root.unmount()); node.remove(); }
});
