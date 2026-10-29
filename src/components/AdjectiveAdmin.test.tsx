// @vitest-environment jsdom
import {act} from 'react';import{createRoot}from'react-dom/client';import{expect,it,vi}from'vitest';import App from '../App';
vi.mock('./GameRanking',()=>({GameRanking:()=> <div className="game-ranking">Рейтинг<button>Начать</button></div>}));
Object.assign(globalThis,{IS_REACT_ACT_ENVIRONMENT:true});
it('offers every participant three green game buttons leading straight to the ranking',async()=>{
 const node=document.createElement('div'),root=createRoot(node);
 const click=async(text:string)=>{const b=[...node.querySelectorAll('button')].find(b=>b.textContent?.includes(text))!;expect(b).toBeTruthy();await act(async()=>b.click());};
 await act(async()=>root.render(<App memberId="svetlana" isAdmin={false}/>));await click('Игра');await click('Прилагательные');
 expect(node.textContent).not.toContain('Тестовый');const buttons=[...node.querySelectorAll<HTMLButtonElement>('.market-options .big-button')];expect(buttons).toHaveLength(3);expect(buttons.every(b=>!b.disabled)).toBe(true);
 await click('Вкусы, ощущения');expect(node.querySelector('.game-ranking')).toBeTruthy();expect(node.textContent).not.toContain('Тест');await act(async()=>root.unmount());
});
